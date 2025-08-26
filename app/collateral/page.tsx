import { CollateralSupply } from "@/components/collateral-supply";

export default function CollateralPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Collateral Management
        </h1>
        <div className="mt-8 space-y-6">
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="text-xl font-semibold mb-4">
              How to Supply Collateral
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Make sure you have USDT in your wallet</li>
              <li>Enter the amount you want to deposit</li>
              <li>Click "Approve USDT" and confirm the transaction</li>
              <li>Click "Deposit Collateral" and confirm the transaction</li>
              <li>Your collateral will be available for borrowing</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <CollateralSupply />
      </div>
    </div>
  );
}
