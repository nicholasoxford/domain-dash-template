"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  Globe,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  offer: z.string().min(1, "Please enter an offer amount"),
  description: z
    .string()
    .min(10, "Please provide more details about your vision")
    .max(500, "Description must be less than 500 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Component() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<
    "error" | "expired" | "solved" | null
  >(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      offer: "",
      description: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (turnstileStatus !== "solved" || !turnstileToken) {
      form.setError("root", { message: "Please complete the verification" });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer YELLOW_BEAR_SUN",
        },
        body: JSON.stringify({
          ...values,
          amount: Number(values.offer),
          token: turnstileToken,
        }),
      });

      if (!response.ok) throw new Error();

      setSubmitStatus("success");
      form.reset();
      setTurnstileToken(null);
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="backdrop-blur-xl bg-slate-900/80 border-slate-800">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Globe className="w-12 h-12 text-purple-400" />
              </motion.div>
            </div>
            <CardTitle className="text-4xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Make Your Offer
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Secure agi-2025.com with a compelling offer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {submitStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <Alert className="border-green-500/20 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-500">Success!</AlertTitle>
                    <AlertDescription className="text-green-400">
                      Your offer has been submitted successfully.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {submitStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <Alert className="border-red-500/20 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertTitle className="text-red-500">Error</AlertTitle>
                    <AlertDescription className="text-red-400">
                      Failed to submit offer. Please try again.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">
                          Your Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-slate-800/50 border-slate-700 text-slate-200 focus:ring-purple-400 focus:border-purple-400"
                            placeholder="John Doe"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className="bg-slate-800/50 border-slate-700 text-slate-200 focus:ring-purple-400 focus:border-purple-400"
                            placeholder="john@example.com"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

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
                            min="0"
                            step="100"
                            className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200 focus:ring-purple-400 focus:border-purple-400"
                            placeholder="5000"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
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
                          className="bg-slate-800/50 border-slate-700 text-slate-200 focus:ring-purple-400 focus:border-purple-400 min-h-[120px]"
                          placeholder="Share your vision for agi-2025.com..."
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                      <p className="text-xs text-slate-400 mt-2">
                        {field.value.length}/500 characters
                      </p>
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
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="w-full py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? "Submitting..." : "Submit Offer"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
