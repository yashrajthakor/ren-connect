import { useNavigate } from "react-router-dom";
import {
  User,
  Briefcase,
  Handshake,
  MessageCircleQuestion,
  Newspaper,
  Rss,
} from "lucide-react";
import NoticeTicker from "@/components/notices/NoticeTicker";
import NoticeBoardSection from "@/components/notices/NoticeBoardSection";
import SponsorHighlights from "@/components/dashboard/SponsorHighlights";

const quickActions = [
  {
    label: "1:1 Feed",
    description: "Meetings & community posts",
    icon: Rss,
    url: "/dashboard/meetings",
  },
  {
    label: "My Leads",
    description: "Share & track referrals",
    icon: Handshake,
    url: "/dashboard/leads",
  },
  {
    label: "Ask Network",
    description: "Post & browse asks",
    icon: MessageCircleQuestion,
    url: "/dashboard/asks",
  },
  {
    label: "News & Stories",
    description: "Latest community updates",
    icon: Newspaper,
    url: "/dashboard/news",
  },
  {
    label: "My Profile",
    description: "View & edit details",
    icon: User,
    url: "/dashboard/profile",
  },
  {
    label: "Business Directory",
    description: "Browse members",
    icon: Briefcase,
    url: "/dashboard/directory",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <NoticeTicker />
      <NoticeBoardSection
        title="Notice Board"
        subtitle="Latest updates from RBN — meetings, events, and reminders"
        limit={3}
        className="pt-4 sm:pt-6 pb-0"
      />
      <SponsorHighlights />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-display font-bold text-foreground break-words">
            Welcome to your Dashboard
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground mt-1">
            Access your member benefits and resources
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {quickActions.map((action) => (
            <button
              key={action.url}
              type="button"
              onClick={() => navigate(action.url)}
              className="flex h-full min-w-0 flex-col sm:flex-row items-start gap-2.5 sm:gap-4 text-left bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="p-2.5 sm:p-3 bg-primary/10 rounded-lg shrink-0">
                <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground break-words">
                  {action.label}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
