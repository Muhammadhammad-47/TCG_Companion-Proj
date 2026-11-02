-- ============================================================================
-- DOMAIN 1: MULTI-CURRENCY WALLET & ECONOMY FOUNDATION
-- Compatible with existing profiles, tournaments, and match tracking
-- ============================================================================

-- 1. Add 3-currency wallet columns to profiles (Additive & Non-Breaking)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gold INT DEFAULT 500,
ADD COLUMN IF NOT EXISTS gems INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS tournament_credits INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_win_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create Wallet Transactions Ledger Table (Audit trail for currency flow)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    currency TEXT CHECK (currency IN ('gold', 'gems', 'tournament_credits', 'crystals')),
    amount INT NOT NULL, -- Positive for credits, negative for debits
    balance_after INT NOT NULL,
    transaction_type TEXT NOT NULL, -- 'match_win', 'match_loss', 'first_daily_win', 'tournament_entry', 'tournament_payout', 'store_purchase', etc.
    reference_id TEXT, -- e.g. matchId, tournamentId, bundleId
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant wallet ledger history retrieval
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON wallet_transactions(user_id, created_at DESC);

-- 3. Atomic RPC Function: rpc_modify_wallet
-- Guarantees race-condition safety with row-level locks (FOR UPDATE)
CREATE OR REPLACE FUNCTION rpc_modify_wallet(
    p_user_id UUID,
    p_currency TEXT,
    p_amount INT,
    p_type TEXT,
    p_reference_id TEXT DEFAULT NULL
) RETURNS JSONB 
SECURITY DEFINER
AS $$
DECLARE
    v_current_bal INT;
    v_new_bal INT;
BEGIN
    -- Select currency balance with exclusive row lock
    IF p_currency = 'gold' THEN
        SELECT COALESCE(gold, 500) INTO v_current_bal FROM profiles WHERE id = p_user_id FOR UPDATE;
    ELSIF p_currency = 'gems' THEN
        SELECT COALESCE(gems, 50) INTO v_current_bal FROM profiles WHERE id = p_user_id FOR UPDATE;
    ELSIF p_currency = 'tournament_credits' THEN
        SELECT COALESCE(tournament_credits, 0) INTO v_current_bal FROM profiles WHERE id = p_user_id FOR UPDATE;
    ELSIF p_currency = 'crystals' THEN
        SELECT COALESCE(crystals_collected, crystals, 0) INTO v_current_bal FROM profiles WHERE id = p_user_id FOR UPDATE;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid currency specified.');
    END IF;

    IF v_current_bal IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player profile not found.');
    END IF;

    -- Prevent negative balance
    IF v_current_bal + p_amount < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient ' || p_currency || ' balance.');
    END IF;

    v_new_bal := v_current_bal + p_amount;

    -- Apply update
    IF p_currency = 'gold' THEN
        UPDATE profiles SET gold = v_new_bal WHERE id = p_user_id;
    ELSIF p_currency = 'gems' THEN
        UPDATE profiles SET gems = v_new_bal WHERE id = p_user_id;
    ELSIF p_currency = 'tournament_credits' THEN
        UPDATE profiles SET tournament_credits = v_new_bal WHERE id = p_user_id;
    ELSIF p_currency = 'crystals' THEN
        UPDATE profiles SET crystals_collected = v_new_bal, crystals = v_new_bal WHERE id = p_user_id;
    END IF;

    -- Write to audit ledger
    INSERT INTO wallet_transactions (user_id, currency, amount, balance_after, transaction_type, reference_id)
    VALUES (p_user_id, p_currency, p_amount, v_new_bal, p_type, p_reference_id);

    RETURN jsonb_build_object('success', true, 'currency', p_currency, 'new_balance', v_new_bal);
END;
$$ LANGUAGE plpgsql;

-- 4. Row Level Security (RLS) for wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wallet_transactions' AND policyname = 'Users can view their own wallet transactions'
    ) THEN
        CREATE POLICY "Users can view their own wallet transactions"
            ON wallet_transactions FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wallet_transactions' AND policyname = 'Users can insert their own wallet transactions'
    ) THEN
        CREATE POLICY "Users can insert their own wallet transactions"
            ON wallet_transactions FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Permissions & RPC Grants
GRANT SELECT, INSERT ON wallet_transactions TO authenticated;
GRANT SELECT, INSERT ON wallet_transactions TO anon;
GRANT EXECUTE ON FUNCTION rpc_modify_wallet(UUID, TEXT, INT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_modify_wallet(UUID, TEXT, INT, TEXT, TEXT) TO anon;


