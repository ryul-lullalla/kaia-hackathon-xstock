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
//   useCollateralBalance,
//   useBorrow,
//   useRepay,
//   useTokenApproval,
//   useTransactionReceipt,
// } from "@/hooks/use-contracts";
// import { formatTokenAmount } from "@/lib/utils";
// import { CONTRACTS } from "@/lib/config";
// import { toast } from "sonner";
// import {
//   DollarSign,
//   Loader2,
//   ArrowUpCircle,
//   ArrowDownCircle,
// } from "lucide-react";

// export function Borrow() {
//   const { address: userAddress, isConnected } = useAccount();
//   const [amount, setAmount] = useState("");
//   const [isBorrowing, setIsBorrowing] = useState(true);

//   const { data: kxStockBalance, refetch: refetchKxStockBalance } =
//     useKxStockBalance(userAddress);
//   const { data: collateralBalance } = useCollateralBalance(userAddress);

//   const {
//     approve,
//     hash: approveHash,
//     isPending: isApproving,
//   } = useTokenApproval();
//   const { borrow, hash: borrowHash, isPending: isBorrowPending } = useBorrow();
//   const { repay, hash: repayHash, isPending: isRepaying } = useRepay();

//   const { isSuccess: isApproveSuccess } = useTransactionReceipt(approveHash);
//   const { isSuccess: isBorrowSuccess } = useTransactionReceipt(borrowHash);
//   const { isSuccess: isRepaySuccess } = useTransactionReceipt(repayHash);

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

//   const handleBorrow = async () => {
//     if (!userAddress || !amount) return;

//     try {
//       borrow(amount);
//       toast.info("Borrow submitted", {
//         description: "Please confirm the borrow transaction",
//       });
//     } catch (error) {
//       toast.error("Borrow failed", {
//         description: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   };

//   const handleRepay = async () => {
//     if (!userAddress || !amount) return;

//     try {
//       repay(amount, userAddress);
//       toast.info("Repay submitted", {
//         description: "Please confirm the repay transaction",
//       });
//     } catch (error) {
//       toast.error("Repay failed", {
//         description: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   };

//   // Handle transaction success
//   if (isApproveSuccess) {
//     toast.success("kxApple approved successfully!");
//   }

//   if (isBorrowSuccess) {
//     refetchKxStockBalance();
//     toast.success("Borrowed successfully!");
//     setAmount("");
//   }

//   if (isRepaySuccess) {
//     refetchKxStockBalance();
//     toast.success("Repaid successfully!");
//     setAmount("");
//   }

//   const isLoading = isApproving || isBorrowPending || isRepaying;
//   const hasCollateral = collateralBalance && collateralBalance > 0n;

//   // Calculate max borrowable amount (simplified - should use real LTV)
//   const maxBorrowable = collateralBalance
//     ? new Big(collateralBalance.toString())
//         .div(new Big(10).pow(18))
//         .times(new Big(0.75)) // 75% LTV
//     : new Big(0);

//   return (
//     <Card className="w-full max-w-md">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <DollarSign className="h-5 w-5 text-primary" />
//           Borrow
//         </CardTitle>
//         <CardDescription>
//           Borrow kxApple against your USDT collateral
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {isConnected && userAddress && (
//           <div className="grid grid-cols-2 gap-3">
//             <div className="p-3 bg-secondary/50 rounded-lg">
//               <div className="text-sm text-muted-foreground">Collateral</div>
//               <div className="text-lg font-semibold">
//                 {formatTokenAmount(collateralBalance)}
//                 USDT
//               </div>
//             </div>
//             <div className="p-3 bg-secondary/50 rounded-lg">
//               <div className="text-sm text-muted-foreground">
//                 kxApple Balance
//               </div>
//               <div className="text-lg font-semibold">
//                 {formatTokenAmount(kxStockBalance)}
//               </div>
//             </div>
//           </div>
//         )}

//         {hasCollateral && (
//           <div className="p-3 bg-primary/10 rounded-lg">
//             <div className="text-sm text-muted-foreground">
//               Max Borrowable (75% LTV)
//             </div>
//             <div className="text-lg font-bold text-primary">
//               {maxBorrowable.toFixed(4)} kxApple
//             </div>
//           </div>
//         )}

//         {!hasCollateral && isConnected && (
//           <div className="p-3 bg-destructive/10 rounded-lg">
//             <div className="text-sm text-destructive">
//               You need to supply USDT collateral before borrowing
//             </div>
//           </div>
//         )}

//         <div className="flex gap-2">
//           <Button
//             variant={isBorrowing ? "default" : "outline"}
//             onClick={() => setIsBorrowing(true)}
//             className="flex-1"
//           >
//             <ArrowUpCircle className="h-4 w-4" />
//             Borrow
//           </Button>
//           <Button
//             variant={!isBorrowing ? "default" : "outline"}
//             onClick={() => setIsBorrowing(false)}
//             className="flex-1"
//           >
//             <ArrowDownCircle className="h-4 w-4" />
//             Repay
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
//             max={isBorrowing ? Number(maxBorrowable.toString()) : undefined}
//           />
//           {isBorrowing && hasCollateral && (
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => setAmount(maxBorrowable.toString())}
//               className="text-xs h-6 px-2"
//             >
//               Max
//             </Button>
//           )}
//         </div>

//         {isBorrowing ? (
//           <Button
//             onClick={handleBorrow}
//             disabled={!isConnected || !amount || isLoading || !hasCollateral}
//             className="w-full"
//           >
//             {isBorrowPending ? (
//               <>
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 Borrowing...
//               </>
//             ) : (
//               "Borrow kxApple"
//             )}
//           </Button>
//         ) : (
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
//               onClick={handleRepay}
//               disabled={!isConnected || !amount || isLoading}
//               className="w-full"
//             >
//               {isRepaying ? (
//                 <>
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   Repaying...
//                 </>
//               ) : (
//                 "Repay Loan"
//               )}
//             </Button>
//           </div>
//         )}

//         {!isConnected && (
//           <p className="text-sm text-muted-foreground text-center">
//             Connect your wallet to borrow
//           </p>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
