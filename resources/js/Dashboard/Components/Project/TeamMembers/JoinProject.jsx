import { useState, useImperativeHandle, forwardRef } from "react";
import {
  router,
  usePage,
  useRoute,
  Checkbox,
  Divider,
  Spin,
  Input,
} from "@shared/ui";
const JoinProject = forwardRef(
  ({ project, onClose, setParentLoading }, ref) => {
    const { auth } = usePage().props;
    const route = useRoute();

    const initValues = {
      project_id: project?.id,
      user_id: auth.user.id,
      steps: [],
      status: "in_progress",
    };

    const defaultSteps = [
      { key: "project_marking", label: "Marking" },
      { key: "project_excel", label: "Excel Sheet" },
      { key: "project_pricing", label: "Project Pricing" },
      { key: "project_quality_assurance", label: "Quality Assurance" },
    ];

    const [customSteps, setCustomSteps] = useState([]);
    const [newStepInput, setNewStepInput] = useState("");
    const [selectedSteps, setSelectedSteps] = useState([]);
    const [values, setValues] = useState(initValues);
    const [loading, setLoading] = useState(false);

    const handleStepChange = (step, checked) => {
      setSelectedSteps((prev) =>
        checked ? [...prev, step] : prev.filter((s) => s !== step)
      );
      setValues((prev) => ({
        ...prev,
        steps: checked
          ? [...prev.steps, step]
          : prev.steps.filter((s) => s !== step),
      }));
    };

    const handleAddCustomStep = () => {
      const key = newStepInput.trim().toLowerCase().replace(/\s+/g, "_");
      const label = newStepInput.trim();
      if (
        !key ||
        selectedSteps.includes(key) ||
        customSteps.find((s) => s.key === key)
      )
        return;

      const newStep = { key, label };
      setCustomSteps([...customSteps, newStep]);
      setNewStepInput(""); // clear input
    };

    const handleSubmit = () => {
      setLoading(true);
      setParentLoading?.(true);

      router.post(route("JoinProject", { ProjectId: project.id }), values, {
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
      });
    };

    useImperativeHandle(ref, () => ({
      submitForm: handleSubmit,
    }));

    return (
      <>
        <div className="d-flex align-items-center flex-column p-3">
          <h6 className="text-center mb-3">Choose Tasks To Join The Project</h6>
          <Divider />

          {[...defaultSteps, ...customSteps].map((step, index) => (
            <Checkbox
              key={step.key}
              checked={selectedSteps.includes(step.key)}
              onChange={(e) => handleStepChange(step.key, e.target.checked)}
              className={index > 0 ? "ms-3" : ""}
            >
              {step.label}
            </Checkbox>
          ))}

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
              className={`btn btn-sm ${
                loading ? "btn-light border" : "btn-primary"
              }`}
              onClick={handleSubmit}
              disabled={loading || selectedSteps.length === 0}
            >
              {loading ? (
                <Spin size="small">Joining Project Wait...</Spin>
              ) : (
                "Join Project"
              )}
            </button>
          </div>
        </div>
      </>
    );
  }
);

export default JoinProject;
