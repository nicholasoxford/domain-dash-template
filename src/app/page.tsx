"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Globe, DollarSign } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  offer: z.string().min(1, { message: "Please enter an offer amount" }),
  description: z
    .string()
    .min(10, { message: "Please provide more details about your vision" }),
});

import { DomainOffersDO } from "@/lib/durable-objects";
export { DomainOffersDO };

export default function Page() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      offer: "",
      description: "",
    },
  });

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<
    "error" | "expired" | "solved" | null
  >(null);

  const [escCount, setEscCount] = useState(0);
  const [lastEscTime, setLastEscTime] = useState(0);

  // Add ESC key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const currentTime = Date.now();

        // Check if this is a double ESC press within 500ms
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

  const onSubmit = async (_values: z.infer<typeof formSchema>) => {
    if (turnstileStatus !== "solved" || !turnstileToken) {
      alert("Please complete the verification");
      return;
    }
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer YELLOW_BEAR_SUN",
        },
        body: JSON.stringify({
          email: _values.name, // Note: You might want to add a separate email field
          amount: Number(_values.offer),
          description: _values.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Offer submitted successfully:", result);

      // Clear form
      form.reset();
      setTurnstileToken(null);

      // Show success message
      alert("Your offer has been submitted successfully!");
    } catch (error) {
      console.error("Error submitting offer:", error);
      alert("Failed to submit offer. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800"
      >
        <div className="p-8">
          <div className="flex items-center justify-center mb-8">
            <Globe className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-center mb-3 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            Make Your Offer
          </h1>
          <p className="text-slate-400 text-center mb-8">
            Secure agi-2025.com with a compelling offer
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Your Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-slate-800/50 border-slate-700 text-slate-200 focus:ring-purple-400 focus:border-purple-400"
                        placeholder="John Doe"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="offer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">
                      Your Offer (USD)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <Input
                          {...field}
                          type="number"
                          className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200 focus:ring-purple-400 focus:border-purple-400"
                          placeholder="5000"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">
                      How will you use this domain?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-slate-800/50 border-slate-700 text-slate-200 focus:ring-purple-400 focus:border-purple-400"
                        placeholder="Share your vision for agi-2025.com..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-center">
                <Turnstile
                  siteKey="0x4AAAAAAAylKuDyLZriK5lA"
                  onError={() => setTurnstileStatus("error")}
                  onExpire={() => setTurnstileStatus("expired")}
                  onSuccess={(token) => {
                    setTurnstileStatus("solved");
                    setTurnstileToken(token);
                  }}
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-all duration-300"
              >
                Submit Offer
              </motion.button>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}
