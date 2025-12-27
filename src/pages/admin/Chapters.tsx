import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import renLogo from "@/assets/ren-logo.png";

const Chapters = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={renLogo} alt="REN" className="h-10 w-auto" />
              <span className="font-display font-bold text-lg text-foreground">
                Chapters
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Manage Chapters
            </h1>
            <p className="text-muted-foreground mt-1">
              Add and manage chapters
            </p>
          </div>
          <Button variant="royal">
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </div>

        {/* Placeholder */}
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No chapters yet
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Chapters will be listed here. Click "Add Chapter" to create your first chapter.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Chapters;
