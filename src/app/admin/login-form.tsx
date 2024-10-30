// ... other imports ...
"use client";

export default function LoginForm({
  verifyPassword,
}: {
  verifyPassword: (formData: FormData) => Promise<{ error?: string }>;
}) {
  return (
    <form
      action={async (formData) => {
        const result = await verifyPassword(formData);
        if (result?.error) {
          // Handle error if needed
          return;
        }
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-200 mb-1"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
          autoFocus
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-all duration-300"
      >
        Verify
      </button>
    </form>
  );
}
