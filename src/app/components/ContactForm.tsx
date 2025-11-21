"use client"

import { useState, useTransition } from "react"
import { sendContactEmail } from "../actions/send-contact-email"

export function ContactForm() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const result = await sendContactEmail(formData)

      if (result.success) {
        setMessage({ type: "success", text: result.success })
        // Reset form
        form.reset()
      } else if (result.error) {
        setMessage({ type: "error", text: result.error })
      }

      // Auto-hide message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    })
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-3xl px-8 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-8 shadow-xl border-2 border-slate-600/50 space-y-6">
        {/* Name and Email on same line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-lg text-white font-figtree font-medium">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Your name"
              required
              disabled={isPending}
              className="w-full bg-slate-600 text-white rounded-xl px-4 py-3 text-lg border-2 border-slate-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-figtree"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-lg text-white font-figtree font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your.email@example.com"
              required
              disabled={isPending}
              className="w-full bg-slate-600 text-white rounded-xl px-4 py-3 text-lg border-2 border-slate-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-figtree"
            />
          </div>
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <label htmlFor="message" className="block text-lg text-white font-figtree font-medium">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            placeholder="How can we help you?"
            required
            disabled={isPending}
            rows={6}
            className="w-full bg-slate-600 text-white rounded-xl px-4 py-3 text-lg border-2 border-slate-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-slate-300 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-figtree"
          />
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-base font-figtree transition-all ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border-2 border-green-300"
                : "bg-red-100 text-red-800 border-2 border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit Button - Matching Get Started style */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isPending}
            className="group inline-flex items-center justify-between bg-white text-black px-8 py-4 rounded-full font-figtree font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-lg"
          >
            <span>{isPending ? "Sending..." : "Send Message"}</span>
            <div className="ml-4 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
              {isPending ? (
                <svg
                  className="w-5 h-5 text-white animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </form>
    </div>
  )
}

