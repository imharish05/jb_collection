// utils/refundSync.js
const Razorpay = require("razorpay");
const { Refund, Order, Return } = require("../models");

// Initialize Razorpay client safely
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpay = null;
if (keyId && keySecret) {
  razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Synchronizes the status of one or more Refund records with Razorpay.
 * Can take a single Refund instance, an array of Refund instances,
 * or an Order instance / list of Order instances (it will inspect order.refunds).
 */
const syncRefunds = async (target) => {
  if (!razorpay || !target) return;

  const refundsToSync = [];

  // Helper to check if a refund model instance needs syncing
  const checkAndAddRefund = (ref) => {
    if (!ref) return;
    const status = (ref.refundStatus || "").toLowerCase();
    if ((status === "initiated" || status === "pending") && ref.razorpayRefundId) {
      refundsToSync.push(ref);
    }
  };

  // 1. Identify all refunds to sync from target
  if (Array.isArray(target)) {
    for (const item of target) {
      if (item instanceof Refund) {
        checkAndAddRefund(item);
      } else if (item instanceof Order) {
        if (Array.isArray(item.refunds)) {
          item.refunds.forEach(checkAndAddRefund);
        }
      } else if (item instanceof Return) {
        if (item.refund) {
          checkAndAddRefund(item.refund);
        }
      }
    }
  } else {
    if (target instanceof Refund) {
      checkAndAddRefund(target);
    } else if (target instanceof Order) {
      if (Array.isArray(target.refunds)) {
        target.refunds.forEach(checkAndAddRefund);
      }
    } else if (target instanceof Return) {
      if (target.refund) {
        checkAndAddRefund(target.refund);
      }
    }
  }

  // 2. Perform the sync with Razorpay for each identified refund
  for (const refund of refundsToSync) {
    try {
      console.log(`[Refund Sync] Fetching status for refund ID ${refund.razorpayRefundId} from Razorpay...`);
      const rzpRefund = await razorpay.refunds.fetch(refund.razorpayRefundId);
      
      if (rzpRefund && rzpRefund.status) {
        let updatedStatus = null;
        if (rzpRefund.status === "processed") {
          updatedStatus = "completed";
        } else if (rzpRefund.status === "failed") {
          updatedStatus = "failed";
        }

        if (updatedStatus) {
          refund.refundStatus = updatedStatus;
          refund.refundedAt = rzpRefund.created_at ? new Date(rzpRefund.created_at * 1000) : new Date();
          await refund.save();
          console.log(`[Refund Sync] Refund ${refund.razorpayRefundId} updated to: ${updatedStatus}`);

          // Sync Return status if returnId is associated
          if (refund.returnId) {
            await Return.update(
              { status: "refund_completed" },
              { where: { id: refund.returnId } }
            );
          }

          // Sync Order paymentStatus to refunded
          if (refund.orderId) {
            await Order.update(
              { paymentStatus: "refunded" },
              { where: { id: refund.orderId } }
            );
          }
        }
      }
    } catch (err) {
      console.error(`[Refund Sync] Error syncing refund ${refund.razorpayRefundId}:`, err.message);
    }
  }
};

module.exports = { syncRefunds };
