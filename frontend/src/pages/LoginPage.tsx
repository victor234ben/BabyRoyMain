import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PawPrint, Loader } from "lucide-react";
import { toast } from "sonner";

// Schema for form validation
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { login, telegramOauth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [tgUser] = useState(window.Telegram?.WebApp?.initDataUnsafe?.user);
  const navigate = useNavigate();
  const location = useLocation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = (location.state as any)?.from || "/";
 
  // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      tg.ready(); // ✅ This is valid
      tg.expand();

      // console.log("User:", tg.initDataUnsafe.user);

      // const sendTelegramConnection = async () => {
      //   try {
      //     const res = await fetch(`${API_URL}/telegram-connected`, {
      //       method: "POST",
      //       headers: {
      //         "Content-Type": "application/json",
      //       },
      //       body: JSON.stringify({
      //         user: tg.initDataUnsafe.user,
      //         connectedAt: new Date().toISOString(),
      //       }),
      //     });

      //     if (res.ok) {
      //       toast.success("Telegram connected successfully");
      //     } else {
      //       toast.error(`Telegram connection failed: ${res.status}`);
      //     }
      //   } catch (error) {
      //     console.error("Telegram connection error:", error);
      //     toast.error("Telegram connection error");
      //   }
      // };

      // sendTelegramConnection();
    }
  }, []);

  useEffect(() => {
    const authenticateTelegramUser = async () => {
      if (tgUser) {
        try {
          setIsLoading(true);
          const telegramId = tgUser.id;
          const first_name = tgUser.first_name || "";
          const last_name = tgUser.last_name || "";

          await telegramOauth(telegramId, first_name, last_name);
          navigate(from, { replace: true });
        } catch (error) {
          console.error("Telegram OAuth failed:", error);
          setIsLoading(false);
        }
      }
    };

    authenticateTelegramUser();
  }, [tgUser, telegramOauth, from, navigate]);

  const handleSend = () => {
    window.Telegram?.WebApp?.sendData("Hello from TypeScript!");
  };

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // Show loading if Telegram login is in progress
  if (tgUser && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin w-10 h-10 text-paws-primary" />
      </div>
    );
  }
  if (!tgUser) {
    return (
      <div className="flex py-4 min-h-screen items-center justify-center bg-gradient-to-br from-paws-primary/20 to-paws-accent/20 p-4">
        <Card className="w-full max-w-md shadow-xl py-2 animate-fade-in">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-paws-primary">
              <PawPrint className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Welcome to BabyRoy
            </CardTitle>
            <CardDescription>Enter your credentials to sign in</CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your@email.com"
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full paw-button h-12 bg-paws-primary hover:bg-paws-accent"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-paws-primary hover:text-paws-accent"
              >
                Sign up
              </Link>
              <Link to="/telegramLogin">Telegram Login</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }
  return null;
};

export default LoginPage;
