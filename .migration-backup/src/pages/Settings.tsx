import NotificationSettings from "@/components/NotificationSettings";
import ChangePasswordCard from "@/components/ChangePasswordCard";

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account preferences and security settings.
        </p>
      </div>

      <NotificationSettings />

      <ChangePasswordCard />
    </div>
  );
};

export default Settings;