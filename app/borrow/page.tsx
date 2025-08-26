import { Borrow } from "@/components/borrow";

export default function BorrowPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Borrow Assets
        </h1>
        <p className="text-lg text-muted-foreground">
          Borrow kxApple tokens against your USDT collateral. Unlock liquidity
          while keeping your assets.
        </p>
      </div>

      <div className="flex justify-center">
        <Borrow />
      </div>

      <div className="mt-8 space-y-6">
        <div className="p-6 rounded-lg bg-card border border-border">
          <h3 className="text-xl font-semibold mb-4">Borrowing Mechanics</h3>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Borrow kxApple tokens using your USDT collateral as security. This
              allows you to access liquidity without selling your assets.
            </p>
            <p>
              <strong>Loan-to-Value (LTV):</strong> Borrow up to 75% of your
              collateral value
            </p>
            <p>
              <strong>Interest Rate:</strong> Variable rate based on protocol
              utilization
            </p>
            <p>
              <strong>Liquidation Threshold:</strong> 85% - manage your position
              carefully
            </p>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card border border-border">
          <h3 className="text-xl font-semibold mb-4">How to Borrow</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>First, supply USDT collateral in the Collateral section</li>
            <li>Return here and enter the amount you want to borrow</li>
            <li>Click "Borrow kxApple" and confirm the transaction</li>
            <li>The borrowed tokens will appear in your wallet</li>
            <li>Remember to repay your loan to avoid liquidation</li>
          </ol>
        </div>

        <div className="p-6 rounded-lg bg-card border border-border">
          <h3 className="text-xl font-semibold mb-4">How to Repay</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Switch to "Repay" mode using the toggle</li>
            <li>Enter the amount you want to repay</li>
            <li>Click "Approve kxApple" if needed</li>
            <li>Click "Repay Loan" and confirm the transaction</li>
            <li>Your collateral will be freed up proportionally</li>
          </ol>
        </div>

        <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/20">
          <h3 className="text-xl font-semibold mb-4 text-destructive">
            Liquidation Risk
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • If your loan value exceeds 85% of collateral, you may be
              liquidated
            </p>
            <p>• Monitor your position regularly and repay loans when needed</p>
            <p>• Consider repaying loans during market volatility</p>
            <p>• Liquidation incurs a penalty fee to protect the protocol</p>
          </div>
        </div>
      </div>
    </div>
  );
}
