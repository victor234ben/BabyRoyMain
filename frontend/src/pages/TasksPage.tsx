import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { taskAPI, Task } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Package, PackagePlus, Plus, Loader } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletConnection } from "@/hooks/useWalletConnection";

type TaskCategory = "ingame" | "partners";

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TaskCategory>("ingame");
  const { connectWallet, disconnectWallet, isConnected, walletAddress } =
    useWalletConnection();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await taskAPI.getAllTasks();
        setTasks(data.tasks);
        setFilteredTasks(data.tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    // Filter tasks based on search term and active tab
    let result = tasks;

    if (searchTerm) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeTab !== "ingame") {
      result = result.filter((task) => task.taskType === activeTab);
    }

    setFilteredTasks(result);
  }, [searchTerm, activeTab, tasks]);

  const updateSingleTask = (updatedTask) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === updatedTask._id ? updatedTask : task
      )
    );
  };

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleVisibilityAndUpdate = (callback: () => Promise<void>) => {
    let userLeft = false;

    const onVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        userLeft = true;
      }

      if (document.visibilityState === "visible" && userLeft) {
        await wait(4000);
        await callback();
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
  };

  const handleAutoVerification = async (taskId: string) => {
    setProcessing(taskId);
    await wait(4000);
    try {
      const res = await taskAPI.getTaskById(taskId);
      updateSingleTask(res.task);
    } catch (error) {
      console.error("Error fetching task:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleLinkVisitVerification = async (
    taskId: string,
    verificationData: string
  ) => {
    window.open(verificationData, "_blank");
    setProcessing(taskId);

    handleVisibilityAndUpdate(async () => {
      try {
        const res = await taskAPI.getTaskById(taskId);
        updateSingleTask(res.task);
      } catch (error) {
        console.error("Error fetching task:", error);
      } finally {
        setProcessing(null);
      }
    });
  };

  const handleActionVerification = async (
    taskId: string,
    verificationData: string,
    action: string,
    telegramId: string
  ) => {
    if (action === "connect") {
      try {
        let address: string | null = walletAddress;

        // If not connected, trigger connection
        if (!isConnected) {
          address = (await connectWallet()) as string;
        }

        // Send to backend
        const res = await taskAPI.connectWallet(taskId, action, address);
        updateSingleTask(res.task);
        toast.success("Wallet connected successfully!");
      } catch (error) {
        console.error("Wallet modal error", error);
        toast.error("modal opened error");
      }
    } else {
      window.open(verificationData, "_blank");
      setProcessing(taskId);

      handleVisibilityAndUpdate(async () => {
        try {
          const data = await taskAPI.verifyTask(taskId, action, telegramId);
          updateSingleTask(data.task);
        } catch (error) {
          console.error("Error verifying task:", error);
        } finally {
          setProcessing(null);
        }
      });
    }
  };

  const handlePendingTask = async (taskId: string) => {
    try {
      const res = await taskAPI.completeTask(taskId);
      const newStatus = res.taskCompletion?.status || "pending";

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId
            ? {
                ...task,
                userStatus: newStatus,
                userSubmission: res.taskCompletion.submissionData || "",
              }
            : task
        )
      );
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleTaskClick = async (
    taskId: string,
    userStatus: string,
    verificationData: string,
    verificationMethod: string,
    action: string,
    telegramId: string
  ) => {
    try {
      if (userStatus === "available") {
        if (verificationMethod === "auto") {
          await handleAutoVerification(taskId);
        } else if (verificationMethod === "link-visit") {
          await handleLinkVisitVerification(taskId, verificationData);
        } else if (verificationMethod === "action") {
          await handleActionVerification(
            taskId,
            verificationData,
            action,
            telegramId
          );
        } else {
          return null;
        }
      } else if (userStatus === "pending") {
        await handlePendingTask(taskId);
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const getTaskCounts = (status: TaskCategory) => {
    if (status === "ingame") return tasks.length;
    console.log();
    return tasks.filter((task) => task.taskType === status).length;
  };

  const getTabIcon = (category: TaskCategory) => {
    switch (category) {
      case "ingame":
        return <Package className="h-4 w-4" />;
      case "partners":
        return <PackagePlus className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="">
          <h1 className="text-3xl font-bold mb-2 text-white">TASKS</h1>
          <div>
            <span className="text-xl font-semibold text-white">
              GET REWARDS{" "}
            </span>
            <span className="text-xl text-gray-300">FOR</span>
          </div>
          <div className="text-xl text-gray-300">COMPLETING QUESTS</div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs for task categories */}
          <Tabs
            defaultValue="ingame"
            onValueChange={(value) => setActiveTab(value as TaskCategory)}
          >
            <TabsList className="grid w-full grid-cols-2">
              {(["ingame", "partners"] as TaskCategory[]).map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex items-center gap-0.5"
                >
                  {getTabIcon(category)}
                  <span className="capitalize font-bold text-md">
                    {category.replace("_", " ")}
                  </span>
                  <span className="ml-1 rounded-full px-0.5 font-semibold py-0.5 text-xs">
                    {getTaskCounts(category)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="ingame" className="mt-4">
              <TaskList
                tasks={filteredTasks}
                loading={loading}
                processing={processing}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>

            <TabsContent value="partners" className="mt-4">
              <TaskList
                tasks={filteredTasks}
                loading={loading}
                processing={processing}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>

            {/* <TaskList tasks={tasks} /> */}
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

type TaskListProps = {
  tasks: Task[];
  loading: boolean;
  processing: string;
  onTaskClick: (
    id: string,
    userStatus: string,
    verificationData: string,
    verificationMethod: string,
    action: string,
    telegramId: string
  ) => void;
};

const TaskList = ({
  tasks,
  loading,
  processing,
  onTaskClick,
}: TaskListProps) => {
  const { user } = useAuth();
  const userTelegramId = user?.user.telegramId;
  if (loading) {
    return (
      <div className="grid grid-cols-1">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="w-full flex flex-row flex-nowrap py-1.5 justify-between items-center">
                <div className="flex flex-row flex-nowrap gap-2.5 items-center justify-start">
                  <Skeleton className="h-10 w-10 rounded-[10px]" />
                  <div className="flex flex-col gap-1 items-start">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
                <div className="block relative w-[80px] h-8">
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardHeader>
            </Card>
          ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg text-white font-medium">No tasks found</h3>
        <p className="text-muted-foreground mt-2">
          No tasks match your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 mb-[80px]">
      {tasks?.map((task) => (
        <Card key={task._id} className="px-2 py-2">
          <CardHeader className="flex flex-row flex-nowrap justify-between items-center">
            <div className="flex flex-row flex-nowrap gap-2.5 items-center justify-start">
              <div>
                {task?.icon ? (
                  <img src={task.icon} className="w-10 h-10  rounded-[10px] " />
                ) : (
                  <span className="block relative h-10 w-10 bg-gray-400 rounded-[10px]"></span>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                </div>
                <CardDescription className="text-xs flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  {task.pointsReward} BabyRoy
                </CardDescription>
              </div>
            </div>
            <div>
              <CardFooter>
                <Button
                  variant={
                    task.userStatus === "available" ? "default" : "outline"
                  }
                  className={
                    task.userStatus === "approved"
                      ? "w-full bg-[#041c31] text-white"
                      : "w-full"
                  }
                  onClick={() =>
                    onTaskClick(
                      task._id,
                      task.userStatus,
                      task.verificationData,
                      task.verificationMethod,
                      task.action,
                      userTelegramId
                    )
                  }
                >
                  {task._id === processing ? (
                    <Loader className="size-6 " />
                  ) : task.userStatus === "available" ? (
                    "Start"
                  ) : task.userStatus === "pending" ? (
                    "Claim"
                  ) : (
                    "Completed"
                  )}
                </Button>
              </CardFooter>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default TasksPage;
