import { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import {
  router,
  usePage,
  useRoute,
  Checkbox,
  Select,
  Divider,
  Spin,
  Input,
  message,
} from "@shared/ui";

const EditJoinProject = forwardRef(
  ({ project, onClose, setParentLoading }, ref) => {
    const { auth } = usePage().props;
    const route = useRoute();
    const members = project.project_team_members || [];

    // Find current user's member record
    const currentUserMember = members.find(
      (member) => member.user?.id === auth.user.id
    );

    // Default available steps
    const defaultSteps = [
      { key: "project_marking", label: "Marking" },
      { key: "project_excel", label: "Excel Sheet" },
      { key: "project_pricing", label: "Project Pricing" },
      { key: "project_quality_assurance", label: "Quality Assurance" },
    ];

    // Status options
    const statusOptions = [
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "on_hold", label: "On Hold" },
      { value: "needs_review", label: "Needs Review" },
    ];

    // Initialize form values with existing member data if available
    const initValues = {
      id: currentUserMember?.id,
      project_id: project?.id,
      user_id: auth.user.id,
      steps: currentUserMember?.steps || [],
      status: currentUserMember?.status || "in_progress",
    };

    // Extract custom steps (those not in defaultSteps)
    const initialCustomSteps =
      currentUserMember?.steps
        ?.filter((step) => !defaultSteps.some((ds) => ds.key === step))
        .map((step) => ({
          key: step,
          label: step.replace("custom_", "").replace(/_/g, " "),
        })) || [];

    const [values, setValues] = useState(initValues);
    const [selectedSteps, setSelectedSteps] = useState(initValues.steps);
    const [customSteps, setCustomSteps] = useState(initialCustomSteps);
    const [newStepInput, setNewStepInput] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      setValues((prev) => ({
        ...prev,
        steps: selectedSteps,
      }));
    }, [selectedSteps]);

    const handleStepChange = (step, checked) => {
      setSelectedSteps((prev) =>
        checked ? [...prev, step] : prev.filter((s) => s !== step)
      );
    };

    const handleStatusChange = (value) => {
      setValues((prev) => ({
        ...prev,
        status: value,
      }));
    };

    const handleAddCustomStep = () => {
      const key = `custom_${newStepInput
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")}`;
      const label = newStepInput.trim();

      if (!label) {
        message.warning("Please enter a task name");
        return;
      }

      if (
        selectedSteps.includes(key) ||
        customSteps.some((s) => s.key === key)
      ) {
        message.warning("This task already exists");
        return;
      }

      const newStep = { key, label };
      setCustomSteps([...customSteps, newStep]);
      setSelectedSteps([...selectedSteps, key]);
      setNewStepInput("");
    };

    const handleSubmit = () => {
      setLoading(true);
      setParentLoading?.(true);

      router.put(
        route("EditJoinProject", { TeamMemberId: currentUserMember?.id }),
        values,
        {
          preserveScroll: true,
          onSuccess: () => {
            setValues(initValues);
            setSelectedSteps([]);
            setCustomSteps([]);
            setNewStepInput("");
            onClose();
          },
          onError: () => {
            setParentLoading?.(false);
            setLoading(false);
          },
          onFinish: () => {
            setParentLoading?.(false);
            setLoading(false);
          },
        }
      );
    };

    useImperativeHandle(ref, () => ({
      submitForm: handleSubmit,
    }));

    return (
      <div className="d-flex align-items-center flex-column p-3">
        <h6 className="text-center">
          {currentUserMember ? "Update Your Tasks" : "Join Project Team"}
          <hr className="mb-0" />
          <div className="d-flex align-items-center mb-1 mt-1">
            <label
              className="me-1"
              htmlFor="status"
              style={{ whiteSpace: "nowrap" }}
            >
              Change Your Status:{" "}
            </label>
            <Select
              style={{ width: "100%" }}
              value={values.status}
              onChange={handleStatusChange}
              options={statusOptions}
              disabled={loading}
            />
          </div>
          <hr className="mt-0" />
        </h6>

        <Divider />

        {/* Default steps */}
        {defaultSteps.map((step) => (
          <Checkbox
            key={step.key}
            checked={selectedSteps.includes(step.key)}
            onChange={(e) => handleStepChange(step.key, e.target.checked)}
          >
            {step.label}
          </Checkbox>
        ))}

        {/* Custom steps */}
        {customSteps.length > 0 &&
          customSteps.map((step) => (
            <Checkbox
              key={step.key}
              checked={selectedSteps.includes(step.key)}
              onChange={(e) => handleStepChange(step.key, e.target.checked)}
            >
              {step.label}
            </Checkbox>
          ))}

        {/* Add custom step input */}
        <div className="mt-3 d-flex">
          <Input
            type="text"
            value={newStepInput}
            onChange={(e) => setNewStepInput(e.target.value)}
            placeholder="Add custom task..."
            allowClear
            suffix={
              <button
                className="btn btn-primary btn-sm m-0 border-0"
                onClick={handleAddCustomStep}
                disabled={!newStepInput.trim()}
              >
                Add More!
              </button>
            }
          />
        </div>

        <Divider />
        <div className="d-flex justify-content-center">
          <button
            className="btn btn-sm btn-outline-secondary me-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`btn btn-sm ${
              loading ? "btn-light border" : "btn-primary"
            }`}
            onClick={handleSubmit}
            disabled={loading || selectedSteps.length === 0}
          >
            {loading ? (
              <Spin size="small">Update Task Wait...</Spin>
            ) : (
              "Update Tasks"
            )}
          </button>
        </div>
      </div>
    );
  }
);

export default EditJoinProject;
