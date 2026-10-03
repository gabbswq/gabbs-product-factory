# Laboratory boundaries

- Keep production URLs, production keys, real payments and private customer
  data out of this prototype. Never change the fixed Asaas Sandbox origin.
- Do not edit or read credential files. Keys enter only through process.env;
  never serialize them into application state, browser responses or test logs.
- Simulator QR is deliberately not a payable Pix payload.
- Preserve unknown creation results. No automatic retry of a payment POST.
- Test money/idempotency/webhooks and browser behavior before integrating.
- Use the repository feature -> develop governance. No main/preview promotion.
