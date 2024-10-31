"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Turnstile } from "@marsidev/react-turnstile";
import { Globe, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Move the FloatingOrb component here
const FloatingOrb = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{
      opacity: [0.4, 0.8, 0.4],
      scale: [1, 1.2, 1],
      x: [0, 100, 0],
      y: [0, -50, 0],
    }}
    transition={{
      duration: 10,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl"
  />
);

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  offer: z.string().min(1, "Please enter an offer amount"),
  description: z
    .string()
    .min(10, "Please provide more details about your vision")
    .max(500, "Description must be less than 500 characters"),
});

export function OfferForm({
  getSiteKey,
}: {
  getSiteKey: () => Promise<{
    TURNSTILE_SITE_KEY: string;
    BASE_URL: string;
  }>;
}) {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<
    "error" | "expired" | "solved" | null
  >(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [escCount, setEscCount] = useState(0);
  const [lastEscTime, setLastEscTime] = useState(0);

  const router = useRouter();

  const [siteKey, setSiteKey] = useState<string>("");
  const [siteBaseUrl, setSiteBaseUrl] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | "idle";
    message: string;
  }>({
    type: "idle",
    message: "",
  });

  const [currentDomain, setCurrentDomain] = useState<string>("");

  useEffect(() => {
    async function loadSiteKey() {
      console.log("HELLO  I AM HERE 3");
      const env = await getSiteKey();
      setSiteKey(env.TURNSTILE_SITE_KEY);
      setSiteBaseUrl(env.BASE_URL);
      setCurrentDomain(env.BASE_URL);
    }
    loadSiteKey();
  }, []);

  useEffect(() => {
    if (currentDomain && form.getValues("description")) {
      const description = form.getValues("description");
      const updatedDescription = description.replace(
        /([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/g,
        currentDomain
      );
      form.setValue("description", updatedDescription);
    }
  }, [currentDomain]);

  // Keep all your existing useEffect hooks here
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const currentTime = Date.now();
        if (currentTime - lastEscTime < 500) {
          router.push("/admin");
        } else {
          setEscCount((prev) => prev + 1);
        }
        setLastEscTime(currentTime);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, lastEscTime]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      offer: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (turnstileStatus !== "solved" || !turnstileToken) {
      setSubmitStatus({
        type: "error",
        message: "Please complete the verification",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          amount: Number(values.offer),
          token: turnstileToken,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit offer");

      setSubmitStatus({
        type: "success",
        message: "Your offer has been submitted successfully!",
      });
      form.reset();
      setTurnstileToken(null);
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Failed to submit offer. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 flex items-center justify-center p-4 antialiased">
      {/* Keep all your existing JSX here */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-slate-900" />

      <div className="fixed inset-0 overflow-hidden">
        <FloatingOrb delay={0} />
        <FloatingOrb delay={2} />
        <FloatingOrb delay={4} />
      </div>

      {/* Animated gradient overlay */}
      <motion.div
        className="fixed inset-0 opacity-50"
        animate={{
          background: [
            "radial-gradient(600px at 0% 0%, purple 0%, transparent 80%)",
            "radial-gradient(600px at 100% 100%, purple 0%, transparent 80%)",
            "radial-gradient(600px at 0% 100%, purple 0%, transparent 80%)",
            "radial-gradient(600px at 100% 0%, purple 0%, transparent 80%)",
            "radial-gradient(600px at 0% 0%, purple 0%, transparent 80%)",
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Form container with parallax effect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 30,
          opacity: { duration: 0.5 },
        }}
        className="relative w-full max-w-md"
      >
        <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-pink-500/10 rounded-2xl" />

          <div className="relative p-8">
            <div className="flex items-center gap-4 mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="p-2 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 backdrop-blur-sm"
              >
                <Globe className="w-8 h-8 text-purple-300" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 text-transparent bg-clip-text">
                  Make Your Offer
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Secure {siteBaseUrl} with a compelling offer
                </p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Your Name
                  </label>
                  <input
                    {...form.register("name")}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Email Address
                  </label>
                  <input
                    {...form.register("email")}
                    type="email"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Your Offer (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    $
                  </span>
                  <input
                    {...form.register("offer")}
                    type="number"
                    className="w-full pl-8 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  How will you use this domain?
                </label>
                <textarea
                  {...form.register("description")}
                  onChange={(e) => {
                    form.register("description").onChange(e);
                    setCharacterCount(e.target.value.length);
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 min-h-[120px] resize-none"
                  placeholder={`Share your vision for ${siteBaseUrl}...`}
                />
                <div className="text-xs text-slate-400">
                  {characterCount}/500 characters
                </div>
              </div>

              <div className="flex justify-center p-4 rounded-lg bg-white/5 border border-white/10">
                <Turnstile
                  siteKey={siteKey}
                  onError={() => setTurnstileStatus("error")}
                  onExpire={() => setTurnstileStatus("expired")}
                  onSuccess={(token) => {
                    setTurnstileStatus("solved");
                    setTurnstileToken(token);
                  }}
                />
              </div>

              {/* Status Message */}
              <AnimatePresence>
                {submitStatus.message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`rounded-lg p-4 text-sm ${
                      submitStatus.type === "success"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {submitStatus.message}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className={`relative w-full group ${
                  isSubmitting ? "cursor-not-allowed opacity-80" : ""
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200 ${
                    isSubmitting ? "opacity-50" : ""
                  }`}
                />
                <div className="relative flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold leading-none">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        animate={{ x: isHovered ? 5 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        Submit Offer
                      </motion.div>
                      <motion.div
                        animate={{ x: isHovered ? 5 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.button>

              {/* Form validation errors */}
              <AnimatePresence>
                {Object.keys(form.formState.errors).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400"
                  >
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(form.formState.errors).map(
                        ([field, error]) => (
                          <li key={field}>{error?.message?.toString()}</li>
                        )
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
