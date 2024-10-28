import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Globe, DollarSign } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function Component() {
  const [name, setName] = useState("");
  const [offer, setOffer] = useState("");
  const [description, setDescription] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<
    "error" | "expired" | "solved" | null
  >(null);

  useEffect(() => {
    // Load the Turnstile script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turnstileStatus !== "solved" && turnstileToken !== null) {
      alert("Please complete the Turnstile challenge");
      return;
    }

    try {
      const response = await fetch(
        "https://durable-object-starter.noxford1.workers.dev?domain=agi-2025.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer YELLOW_BEAR_SUN",
          },
          body: JSON.stringify({
            email: name, // Note: You might want to add a separate email field
            amount: Number(offer),
            description: description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Offer submitted successfully:", result);

      // Clear form
      setName("");
      setOffer("");
      setDescription("");
      setTurnstileToken(null);

      // Show success message
      alert("Your offer has been submitted successfully!");
    } catch (error) {
      console.error("Error submitting offer:", error);
      alert("Failed to submit offer. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center justify-center mb-6">
            <Globe className="w-12 h-12 text-purple-600 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
            Make Your Offer
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Secure agi-2025.com with a compelling offer
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 block"
              >
                Your Name
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="offer"
                className="text-sm font-medium text-gray-700 block"
              >
                Your Offer (USD)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="offer"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="5000"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700 block"
              >
                How will you use this domain?
              </Label>
              <Textarea
                id="description"
                placeholder="Share your vision for agi-2025.com..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

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
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-all duration-300"
            >
              Submit Offer
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
