import { FolderPlus, History, LogIn, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ObservationOptionCard from "@/features/observation-tool/components/ObservationOptionCard";
import ObservationPanelLayout from "@/features/observation-tool/components/ObservationPanelLayout";

export default function SessionOptionsPage() {
  const navigate = useNavigate();

  return (
    <ObservationPanelLayout
      title="Observation Mode"
      subtitle="Choose how you want to work inside observation mode."
      onBack={() => navigate("/apps")}
      backIcon="home"
      bodyClassName="observation-panel-body--menu"
    >
      <div className="observation-option-list">
        <ObservationOptionCard
          icon={FolderPlus}
          title="Create New Session"
          description="Create your own observation session that other users may join."
          tone="cyan"
          onClick={() => navigate("/create-new")}
        />
        <ObservationOptionCard
          icon={LogIn}
          title="Join Existing Session"
          description="Enter a join code to participate in an existing observation session."
          tone="green"
          onClick={() => navigate("/join-existing")}
        />
        <ObservationOptionCard
          icon={History}
          title="View Previous Sessions"
          description="View and rejoin any of the sessions that you have joined in the past."
          tone="yellow"
          onClick={() => navigate("/view-sessions")}
        />
        <ObservationOptionCard
          icon={Settings2}
          title="Manage Your Sessions"
          description="View and manage all of the sessions that you have created."
          tone="blue"
          onClick={() => navigate("/manage-sessions")}
        />
      </div>
    </ObservationPanelLayout>
  );
}
