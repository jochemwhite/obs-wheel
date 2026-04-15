import { CreateEventSubSubscriptionRequest, EventSubSubscriptionType } from "@/types/twitch";
import { env } from "process";

// Common transport configurations
const CONDUIT_TRANSPORT = {
  method: "conduit" as const,
  conduit_id: "a9680d16-1f72-46ef-b021-3ec5ade1ad41",
};

const createWebhookTransport = () => ({
  method: "webhook" as const,
  callback: "https://api.xpudu.com/webhooks/twitch/eventsub",
  secret: env.TWITCH_WEBHOOK_SECRET,
});

// Type for subscription configuration
type SubscriptionConfig = {
  type: EventSubSubscriptionType;
  version: string;
  condition: (userId: string) => Record<string, unknown>;
  requiredScopes: readonly string[];
};

// Configure all conduit subscriptions with their conditions
const conduitSubscriptions: SubscriptionConfig[] = [
  {
    type: "channel.chat.message",
    version: "1",
    condition: (userId) => ({ broadcaster_user_id: userId, user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage
    requiredScopes: ["user:read:chat", "user:bot", "channel:bot"],
  },
  {
    type: "channel.cheer",
    version: "1",
    condition: (userId) => ({ broadcaster_user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcheer
    requiredScopes: ["bits:read"],
  },
  {
    type: "channel.subscribe",
    version: "1",
    condition: (userId) => ({ broadcaster_user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscribe
    requiredScopes: ["channel:read:subscriptions"],
  },
  {
    type: "channel.subscription.gift",
    version: "1",
    condition: (userId) => ({ broadcaster_user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptiongift
    requiredScopes: ["channel:read:subscriptions"],
  },
  {
    type: "channel.subscription.message",
    version: "1",
    condition: (userId) => ({ broadcaster_user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelsubscriptionmessage
    requiredScopes: ["channel:read:subscriptions"],
  },
  {
    type: "channel.update",
    version: "2",
    condition: (userId) => ({ broadcaster_user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate
    requiredScopes: [],
  },
  {
    type: "channel.channel_points_custom_reward_redemption.add",
    version: "1",
    condition: (userId) => ({ broadcaster_user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchannel_points_custom_reward_redemptionadd
    requiredScopes: ["channel:read:redemptions"],
  },
  {
    type: "channel.ad_break.begin",
    version: "1",
    condition: (userId) => ({ broadcaster_user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelad_breakbegin
    requiredScopes: ["channel:read:ads"],
  },
];

// Configure all webhook subscriptions with their conditions
const webhookSubscriptions: SubscriptionConfig[] = [
  {
    type: "stream.offline",
    version: "1",
    condition: (userId) => ({ broadcaster_user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamoffline
    requiredScopes: [],
  },
  {
    type: "stream.online",
    version: "1",
    condition: (userId) => ({ broadcaster_user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#streamonline
    requiredScopes: [],
  },
  {
    type: "channel.update",
    version: "2",
    condition: (userId) => ({ broadcaster_user_id: userId }),
    // https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelupdate
    requiredScopes: [],
  },
];

export const neededEventSubScopes = Array.from(
  new Set([...conduitSubscriptions, ...webhookSubscriptions].flatMap(({ requiredScopes }) => requiredScopes))
).sort();

export default async function NeededEventSubscriptions(twitchUserId: string): Promise<CreateEventSubSubscriptionRequest[]> {
  // Generate conduit subscriptions with conditions
  const conduitRequests = conduitSubscriptions.map(({ type, version, condition }) => ({
    type,
    version,
    condition: condition(twitchUserId),
    transport: CONDUIT_TRANSPORT,
  }));

  // Generate webhook subscriptions with conditions
  // const webhookRequests = webhookSubscriptions.map(({ type, version, condition }) => ({
  //   type,
  //   version,
  //   condition: condition(twitchUserId),
  //   transport: createWebhookTransport(),
  // }));

  return [...conduitRequests];
}
