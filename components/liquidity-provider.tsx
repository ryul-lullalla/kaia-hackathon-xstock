// "use client";

// import { useState } from "react";
// import { useAccount } from "wagmi";
// import Big from "big.js";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   useKxStockBalance,
//   useLendingVaultBalance,
//   useLendingDeposit,
//   useLendingWithdraw,
//   useTokenApproval,
//   useTransactionReceipt,
// } from "@/hooks/use-contracts";
// import { formatTokenAmount } from "@/lib/utils";
// import { CONTRACTS } from "@/lib/config";
// import { toast } from "sonner";
// import {
//   TrendingUp,
//   Loader2,
//   ArrowUpCircle,
//   ArrowDownCircle,
// } from "lucide-react";

// export function LiquidityProvider() {
//   const { address: userAddress, isConnected } = useAccount();
//   const [amount, setAmount] = useState("");
//   const [isDepositing, setIsDepositing] = useState(true);

//   const { data: kxStockBalance, refetch: refetchKxStockBalance } =
//     useKxStockBalance(userAddress);
//   const { data: vaultBalance, refetch: refetchVaultBalance } =
//     useLendingVaultBalance(userAddress);

//   const {
//     approve,
//     hash: approveHash,
//     isPending: isApproving,
//   } = useTokenApproval();
//   const {
//     deposit,
//     hash: depositHash,
//     isPending: isDepositPending,
//   } = useLendingDeposit();
//   const {
//     withdraw,
//     hash: withdrawHash,
//     isPending: isWithdrawing,
//   } = useLendingWithdraw();

//   const { isSuccess: isApproveSuccess } = useTransactionReceipt(approveHash);
//   const { isSuccess: isDepositSuccess } = useTransactionReceipt(depositHash);
//   const { isSuccess: isWithdrawSuccess } = useTransactionReceipt(withdrawHash);

//   const handleApprove = async () => {
//     if (!userAddress || !amount) return;

//     try {
//       approve(CONTRACTS.KX_APPLE, CONTRACTS.LENDING_VAULT, amount);
//       toast.info("Approval submitted", {
//         description: "Please confirm the approval transaction",
//       });
//     } catch (error) {
//       toast.error("Approval failed", {
//         description: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   };

//   const handleDeposit = async () => {
//     if (!userAddress || !amount) return;

//     try {
//       deposit(amount, userAddress);
//       toast.info("Deposit submitted", {
//         description: "Please confirm the deposit transaction",
//       });
//     } catch (error) {
//       toast.error("Deposit failed", {
//         description: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   };

//   const handleWithdraw = async () => {
//     if (!userAddress || !amount) return;

//     try {
//       withdraw(amount, userAddress, userAddress);
//       toast.info("Withdrawal submitted", {
//         description: "Please confirm the withdrawal transaction",
//       });
//     } catch (error) {
//       toast.error("Withdrawal failed", {
//         description: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   };

//   // Handle transaction success
//   if (isApproveSuccess) {
//     toast.success("kxApple approved successfully!");
//   }

//   if (isDepositSuccess) {
//     refetchKxStockBalance();
//     refetchVaultBalance();
//     toast.success("Liquidity provided successfully!");
//     setAmount("");
//   }

//   if (isWithdrawSuccess) {
//     refetchKxStockBalance();
//     refetchVaultBalance();
//     toast.success("Liquidity withdrawn successfully!");
//     setAmount("");
//   }

//   const isLoading = isApproving || isDepositPending || isWithdrawing;

//   return (
//     <Card className="w-full max-w-md">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <TrendingUp className="h-5 w-5 text-primary" />
//           Liquidity Provider
//         </CardTitle>
//         <CardDescription>
//           Provide kxApple liquidity and earn interest
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {isConnected && userAddress && (
//           <div className="grid grid-cols-2 gap-3">
//             <div className="p-3 bg-secondary/50 rounded-lg">
//               <div className="text-sm text-muted-foreground">
//                 kxApple Balance
//               </div>
//               <div className="text-lg font-semibold">
//                 {formatTokenAmount(kxStockBalance)}
//               </div>
//             </div>
//             <div className="p-3 bg-secondary/50 rounded-lg">
//               <div className="text-sm text-muted-foreground">Vault Shares</div>
//               <div className="text-lg font-semibold">
//                 {formatTokenAmount(vaultBalance)}
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="p-3 bg-primary/10 rounded-lg">
//           <div className="text-sm text-muted-foreground">Current APY</div>
//           <div className="text-xl font-bold text-primary">
//             ~{new Big(5.2).toFixed(1)}%
//           </div>
//         </div>

//         <div className="flex gap-2">
//           <Button
//             variant={isDepositing ? "default" : "outline"}
//             onClick={() => setIsDepositing(true)}
//             className="flex-1"
//           >
//             <ArrowUpCircle className="h-4 w-4" />
//             Supply
//           </Button>
//           <Button
//             variant={!isDepositing ? "default" : "outline"}
//             onClick={() => setIsDepositing(false)}
//             className="flex-1"
//           >
//             <ArrowDownCircle className="h-4 w-4" />
//             Withdraw
//           </Button>
//         </div>

//         <div className="space-y-2">
//           <label className="text-sm font-medium">Amount (kxApple)</label>
//           <Input
//             type="number"
//             value={amount}
//             onChange={(e) => setAmount(e.target.value)}
//             placeholder="Enter amount"
//             min="0"
//           />
//         </div>

//         {isDepositing ? (
//           <div className="space-y-2">
//             <Button
//               onClick={handleApprove}
//               disabled={!isConnected || !amount || isLoading}
//               variant="outline"
//               className="w-full"
//             >
//               {isApproving ? (
//                 <>
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   Approving...
//                 </>
//               ) : (
//                 "Approve kxApple"
//               )}
//             </Button>
//             <Button
//               onClick={handleDeposit}
//               disabled={!isConnected || !amount || isLoading}
//               className="w-full"
//             >
//               {isDepositPending ? (
//                 <>
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   Supplying...
//                 </>
//               ) : (
//                 "Supply Liquidity"
//               )}
//             </Button>
//           </div>
//         ) : (
//           <Button
//             onClick={handleWithdraw}
//             disabled={!isConnected || !amount || isLoading}
//             className="w-full"
//           >
//             {isWithdrawing ? (
//               <>
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 Withdrawing...
//               </>
//             ) : (
//               "Withdraw Liquidity"
//             )}
//           </Button>
//         )}

//         {!isConnected && (
//           <p className="text-sm text-muted-foreground text-center">
//             Connect your wallet to provide liquidity
//           </p>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
