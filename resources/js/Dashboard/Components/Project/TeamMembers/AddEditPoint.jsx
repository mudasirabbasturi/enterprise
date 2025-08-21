import { useState, useMemo, useEffect } from "react";
import { InputNumber, Select, useRoute, router } from "@shared/ui";

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const AddEditPoint = ({
  member_id,
  name,
  points_gain,
  project,
  onClose,
  setParentLoading,
}) => {
  const route = useRoute();
  const members = project?.project_team_members ?? [];
  const totalPoints = toNum(project?.project_points);

  // Default values based on props
  const defaultValues = {
    id: member_id,
    points_gain: toNum(points_gain),
  };

  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState(defaultValues);

  // Reset values when member_id or points_gain change
  useEffect(() => {
    setValues({
      id: member_id,
      points_gain: toNum(points_gain),
    });
  }, [member_id, points_gain]);

  // Calculate other members used points
  const otherMembersUsed = useMemo(() => {
    return members.reduce((sum, m) => {
      if (m?.id === values.id) return sum;
      return sum + toNum(m?.points_gain);
    }, 0);
  }, [members, values.id]);

  const maxForSelected = Math.max(0, totalPoints - otherMembersUsed);

  // Calculate total used and left points
  const totalUsedLive = useMemo(() => {
    return otherMembersUsed + toNum(values.points_gain);
  }, [otherMembersUsed, values.points_gain]);

  const totalLeftLive = Math.max(0, totalPoints - totalUsedLive);

  // When user selects a different member
  const onChangeMember = (memberId) => {
    const selected = members.find((m) => m.id === memberId);
    setValues({
      id: memberId,
      points_gain: toNum(selected?.points_gain),
    });
  };

  // When user changes points
  const onChangeValue = (key, value) => {
    if (key === "points_gain") {
      const n = toNum(value);
      const clamped = Math.min(Math.max(0, n), maxForSelected);
      setValues((prev) => ({ ...prev, points_gain: clamped }));
      return;
    }
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // Submit handler
  const onSubmit = () => {
    setLoading(true);
    setParentLoading?.(true);
    router.put(route("AddEditScore", values.id), values, {
      preserveScroll: true,
      onSuccess: () => {
        setValues(defaultValues); // reset after submit
        onClose();
      },
      onError: () => {
        setLoading(false);
        setParentLoading?.(false);
      },
      onFinish: () => {
        setLoading(false);
        setParentLoading?.(false);
      },
    });
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-center flex-column align-items-center">
        <hr className="mb-2 mt-0" />
        <div className="mt-1 mb-1">
          <div className="d-flex bg-light p-2 rounded">
            <h6 style={{ textDecoration: "underline" }} className="me-2 mb-0">
              Project Team Member Score Detail:
            </h6>
          </div>
        </div>
        <hr className="mb-2 mt-2" />

        {/* Points Summary (live) */}
        <ul style={{ listStyle: "circle", fontStyle: "italic" }}>
          <li>Total Project Points: {totalPoints}</li>
          <li>Total Points Used: {totalUsedLive}</li>
          <li>Total Points Left: {totalLeftLive}</li>
        </ul>

        {/* Member Points List */}
        <ul style={{ listStyle: "circle", fontStyle: "italic" }}>
          {members.map((member) => {
            const livePoints =
              member.id === values.id
                ? toNum(values.points_gain)
                : toNum(member.points_gain);
            return (
              <li key={member.id}>
                {member.user?.name || "Unknown"}: {livePoints} Points
              </li>
            );
          })}
        </ul>

        {/* Update Form */}
        <ul style={{ listStyle: "circle", fontStyle: "italic" }}>
          <li className="d-flex align-items-center justify-content-between w-100">
            <Select
              options={
                members.map((member) => ({
                  value: member.id,
                  label: member.user?.name || "Unknown",
                })) || []
              }
              placeholder="Choose a member"
              value={values.id}
              onChange={onChangeMember}
              disabled={loading}
            />

            <InputNumber
              className="w-100 ms-1"
              placeholder={`Enter Points (max ${maxForSelected})`}
              value={values.points_gain}
              onChange={(value) => onChangeValue("points_gain", value)}
              min={0}
              max={maxForSelected}
              disabled={loading}
            />

            <button
              className="ms-1 btn btn-sm btn-primary"
              disabled={loading}
              onClick={onSubmit}
            >
              Update
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AddEditPoint;
