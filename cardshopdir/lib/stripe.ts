import Stripe from "stripe"
import { env } from "@/lib/env"

let _stripe: Stripe | null = null

export function getStripe() {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    _stripe = new Stripe(env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

