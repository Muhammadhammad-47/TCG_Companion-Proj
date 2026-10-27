-- ====================================================================
-- ATTENTION TCG ECOSYSTEM: KONTROLA TOURNAMENTS & BRACKETS SCHEMA
-- ====================================================================

-- 1. Ensure app_settings has tournament configuration columns
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    match_cost INTEGER DEFAULT 1,
    premium_modules TEXT[] DEFAULT ARRAY['kontrola'],
    module_costs JSONB DEFAULT '{}'::jsonb,
    tournament_admin_deduction_pct NUMERIC(5,2) DEFAULT 10.00,
    tournament_min_entry_fee INTEGER DEFAULT 0,
    tournament_max_entry_fee INTEGER DEFAULT 500,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS tournament_admin_deduction_pct NUMERIC(5,2) DEFAULT 10.00;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS tournament_min_entry_fee INTEGER DEFAULT 0;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS tournament_max_entry_fee INTEGER DEFAULT 500;

-- 2. KONTROLA TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS public.kontrola_tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('public', 'private')),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    creator_name VARCHAR(100) NOT NULL DEFAULT 'Admin',
    invite_code VARCHAR(10) UNIQUE,
    bracket_size INT NOT NULL CHECK (bracket_size IN (4, 8, 16, 32)),
    series_format VARCHAR(10) NOT NULL DEFAULT 'bo1' CHECK (series_format IN ('bo1', 'bo3', 'bo5')),
    entry_fee INT NOT NULL DEFAULT 0 CHECK (entry_fee >= 0),
    bonus_prize INT NOT NULL DEFAULT 0 CHECK (bonus_prize >= 0),
    admin_deduction_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (admin_deduction_pct >= 0 AND admin_deduction_pct <= 100),
    total_pot INT NOT NULL DEFAULT 0,
    admin_deducted_amount INT NOT NULL DEFAULT 0,
    winner_payout INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'registration'
        CHECK (status IN ('registration', 'in_progress', 'completed', 'cancelled')),
    bracket_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    winner_name VARCHAR(100),
    registration_deadline TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure registration_deadline exists on existing tables
ALTER TABLE public.kontrola_tournaments ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tournaments_type_status ON public.kontrola_tournaments (type, status);
CREATE INDEX IF NOT EXISTS idx_tournaments_invite_code ON public.kontrola_tournaments (invite_code);
CREATE INDEX IF NOT EXISTS idx_tournaments_deadline ON public.kontrola_tournaments (registration_deadline);

-- 3. KONTROLA TOURNAMENT PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.kontrola_tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.kontrola_tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_name VARCHAR(100) NOT NULL,
    character_id VARCHAR(50) DEFAULT 'chynaman',
    seed INT,
    status VARCHAR(20) NOT NULL DEFAULT 'registered'
        CHECK (status IN ('registered', 'active', 'eliminated', 'winner')),
    entry_fee_paid INT NOT NULL DEFAULT 0,
    registered_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_tourney_user ON public.kontrola_tournament_participants (tournament_id, user_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.kontrola_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kontrola_tournament_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tournaments viewable by everyone" ON public.kontrola_tournaments;
CREATE POLICY "Tournaments viewable by everyone" ON public.kontrola_tournaments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create tournaments" ON public.kontrola_tournaments;
CREATE POLICY "Authenticated users can create tournaments" ON public.kontrola_tournaments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tournament creators and admins can update tournaments" ON public.kontrola_tournaments;
CREATE POLICY "Tournament creators and admins can update tournaments" ON public.kontrola_tournaments FOR UPDATE USING (
    auth.uid() = creator_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Participants viewable by everyone" ON public.kontrola_tournament_participants;
CREATE POLICY "Participants viewable by everyone" ON public.kontrola_tournament_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can join tournaments" ON public.kontrola_tournament_participants;
CREATE POLICY "Authenticated users can join tournaments" ON public.kontrola_tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Participants can update own registration or admin can update" ON public.kontrola_tournament_participants;
CREATE POLICY "Participants can update own registration or admin can update" ON public.kontrola_tournament_participants FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 5. ATOMIC RPC: JOIN TOURNAMENT WITH ROW LOCKS (Eliminates Race Conditions & Double-Spending)
CREATE OR REPLACE FUNCTION public.rpc_join_tournament(
    p_tournament_id UUID,
    p_user_id UUID,
    p_player_name TEXT,
    p_character_id TEXT DEFAULT 'chynaman'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tourney public.kontrola_tournaments%ROWTYPE;
    v_current_count INT;
    v_user_crystals INT;
    v_new_pot INT;
    v_admin_rake INT;
    v_winner_payout INT;
BEGIN
    -- Row-level lock on tournament row
    SELECT * INTO v_tourney FROM public.kontrola_tournaments WHERE id = p_tournament_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tournament does not exist.');
    END IF;

    IF v_tourney.status != 'registration' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration is closed.');
    END IF;

    -- Check registration deadline
    IF v_tourney.registration_deadline IS NOT NULL AND v_tourney.registration_deadline <= NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration deadline has expired.');
    END IF;

    -- Check participant count
    SELECT COUNT(*) INTO v_current_count FROM public.kontrola_tournament_participants WHERE tournament_id = p_tournament_id;
    IF v_current_count >= v_tourney.bracket_size THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tournament bracket is already full.');
    END IF;

    -- Check already joined
    IF EXISTS (SELECT 1 FROM public.kontrola_tournament_participants WHERE tournament_id = p_tournament_id AND user_id = p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are already registered.');
    END IF;

    -- Row-level lock on user profile crystals
    SELECT crystals_collected INTO v_user_crystals FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    IF v_user_crystals IS NULL OR v_user_crystals < v_tourney.entry_fee THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient Stability Crystals.');
    END IF;

    -- Atomically deduct entry fee
    IF v_tourney.entry_fee > 0 THEN
        UPDATE public.profiles
        SET crystals_collected = crystals_collected - v_tourney.entry_fee,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;

    -- Insert participant
    INSERT INTO public.kontrola_tournament_participants(
        tournament_id, user_id, player_name, character_id, seed, status, entry_fee_paid
    ) VALUES (
        p_tournament_id, p_user_id, p_player_name, p_character_id, v_current_count + 1, 'registered', v_tourney.entry_fee
    );

    -- Calculate pot and payout
    v_new_pot := ((v_current_count + 1) * v_tourney.entry_fee) + v_tourney.bonus_prize;
    v_admin_rake := FLOOR(v_new_pot * (v_tourney.admin_deduction_pct / 100.0));
    v_winner_payout := v_new_pot - v_admin_rake;

    UPDATE public.kontrola_tournaments
    SET total_pot = v_new_pot,
        admin_deducted_amount = v_admin_rake,
        winner_payout = v_winner_payout,
        updated_at = NOW()
    WHERE id = p_tournament_id;

    RETURN jsonb_build_object(
        'success', true,
        'joined_seed', v_current_count + 1,
        'total_participants', v_current_count + 1,
        'bracket_size', v_tourney.bracket_size,
        'total_pot', v_new_pot,
        'winner_payout', v_winner_payout
    );
END;
$$;

-- 6. ATOMIC RPC: CANCEL & 100% REFUND (Player Host or Admin)
CREATE OR REPLACE FUNCTION public.rpc_cancel_tournament(
    p_tournament_id UUID,
    p_requester_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tourney public.kontrola_tournaments%ROWTYPE;
    v_is_admin BOOLEAN := false;
    v_p RECORD;
BEGIN
    SELECT * INTO v_tourney FROM public.kontrola_tournaments WHERE id = p_tournament_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tournament not found.');
    END IF;

    IF p_requester_id IS NOT NULL THEN
        SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = p_requester_id;
        -- Allow creator or admin
        IF v_tourney.creator_id != p_requester_id AND (v_is_admin IS NOT TRUE) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Unauthorized. Only the tournament host or an admin can cancel.');
        END IF;
    END IF;

    IF v_tourney.status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel a completed tournament.');
    END IF;

    -- 100% refund to all registered participants
    FOR v_p IN SELECT user_id, entry_fee_paid FROM public.kontrola_tournament_participants WHERE tournament_id = p_tournament_id LOOP
        IF v_p.entry_fee_paid > 0 THEN
            UPDATE public.profiles
            SET crystals_collected = crystals_collected + v_p.entry_fee_paid,
                updated_at = NOW()
            WHERE id = v_p.user_id;
        END IF;
    END LOOP;

    UPDATE public.kontrola_tournaments
    SET status = 'cancelled',
        total_pot = 0,
        winner_payout = 0,
        admin_deducted_amount = 0,
        updated_at = NOW()
    WHERE id = p_tournament_id;

    RETURN jsonb_build_object('success', true, 'message', 'Tournament cancelled and entry fees 100% refunded.');
END;
$$;

-- 7. ATOMIC RPC: AUTO-EXPIRE UNFILLED TOURNAMENTS WITH 100% REFUNDS
CREATE OR REPLACE FUNCTION public.rpc_check_and_expire_tournaments()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tourney RECORD;
    v_part_count INT;
    v_p RECORD;
    v_expired_count INT := 0;
BEGIN
    FOR v_tourney IN
        SELECT id, title, bracket_size
        FROM public.kontrola_tournaments
        WHERE status = 'registration'
          AND registration_deadline IS NOT NULL
          AND registration_deadline <= NOW()
        FOR UPDATE
    LOOP
        SELECT COUNT(*) INTO v_part_count
        FROM public.kontrola_tournament_participants
        WHERE tournament_id = v_tourney.id;

        IF v_part_count < v_tourney.bracket_size THEN
            -- Unfilled bracket: 100% refund all participants
            FOR v_p IN SELECT user_id, entry_fee_paid FROM public.kontrola_tournament_participants WHERE tournament_id = v_tourney.id LOOP
                IF v_p.entry_fee_paid > 0 THEN
                    UPDATE public.profiles
                    SET crystals_collected = crystals_collected + v_p.entry_fee_paid,
                        updated_at = NOW()
                    WHERE id = v_p.user_id;
                END IF;
            END LOOP;

            UPDATE public.kontrola_tournaments
            SET status = 'cancelled',
                total_pot = 0,
                winner_payout = 0,
                admin_deducted_amount = 0,
                updated_at = NOW()
            WHERE id = v_tourney.id;

            v_expired_count := v_expired_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'expired_tournaments_refunded', v_expired_count);
END;
$$;

-- 8. ATOMIC RPC: CONCLUDE TOURNAMENT & PAYOUT WINNER
CREATE OR REPLACE FUNCTION public.rpc_conclude_tournament(
    p_tournament_id UUID,
    p_winner_id UUID,
    p_winner_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tourney public.kontrola_tournaments%ROWTYPE;
BEGIN
    SELECT * INTO v_tourney FROM public.kontrola_tournaments WHERE id = p_tournament_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tournament not found.');
    END IF;

    IF v_tourney.status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tournament already completed.');
    END IF;

    -- Award prize pot to winner
    IF v_tourney.winner_payout > 0 AND p_winner_id IS NOT NULL THEN
        UPDATE public.profiles
        SET crystals_collected = crystals_collected + v_tourney.winner_payout,
            matches_won = matches_won + 1,
            updated_at = NOW()
        WHERE id = p_winner_id;
    END IF;

    UPDATE public.kontrola_tournament_participants
    SET status = 'winner'
    WHERE tournament_id = p_tournament_id AND user_id = p_winner_id;

    UPDATE public.kontrola_tournaments
    SET status = 'completed',
        winner_id = p_winner_id,
        winner_name = p_winner_name,
        ended_at = NOW(),
        updated_at = NOW()
    WHERE id = p_tournament_id;

    RETURN jsonb_build_object(
        'success', true,
        'winner_id', p_winner_id,
        'winner_payout', v_tourney.winner_payout,
        'admin_deducted_amount', v_tourney.admin_deducted_amount
    );
END;
$$;
