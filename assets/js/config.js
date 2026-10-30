/* App.Deals site configuration.
   Payments: paste a PayPal donate link, Stripe Payment Link or Buy Me a Coffee URL to switch the
   Support page from "pledge" mode to instant checkout. Leave blank to keep pledge mode. */
window.SITE = {
  name: "App.Deals",
  domain: "app.deals",
  ownerContactUrl: "https://web.works/contact",
  adsenseClient: "ca-pub-6620975821265271",
  payments: {
    paypal: "",        // e.g. https://www.paypal.com/donate/?hosted_button_id=XXXX
    stripe: "",        // e.g. https://buy.stripe.com/XXXX
    buymeacoffee: ""   // e.g. https://www.buymeacoffee.com/yourname
  },
  /* Form relay key (encoded). Keep it encoded: never paste a plain address anywhere on the site. */
  _k: ["MWFza3Jvd2Jldw==", "bW9jLmxpYW1n"]
};
