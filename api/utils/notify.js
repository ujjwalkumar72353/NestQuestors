import Listing from "../models/listing.model.js";
import Notification from "../models/notification.model.js";
import SearchAlert from "../models/searchAlert.model.js";
import { buildQuery, searchSchema } from "./listingQuery.js";

export const notifyUser = (values) => Notification.create(values);

const parseAlert = (alert) => {
  const parsed = searchSchema.safeParse(
    Object.fromEntries(new URLSearchParams(alert.query))
  );
  return parsed.success ? parsed.data : null;
};

export const notifySearchAlerts = async (listing) => {
  const alerts = await SearchAlert.find({ user: { $ne: listing.userRef } }).limit(500);
  await Promise.all(
    alerts.map(async (alert) => {
      const filters = parseAlert(alert);
      if (!filters) return;
      const { sort, limit, page, ...criteria } = filters;
      const { query } = buildQuery(criteria);
      if (await Listing.exists({ ...query, _id: listing._id })) {
        await notifyUser({
          user: alert.user,
          title: `New match for "${alert.label}"`,
          body: listing.name,
          link: `/listing/${listing._id}`,
        });
      }
    })
  );
};
