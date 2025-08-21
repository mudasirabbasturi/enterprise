import { useMemo, useState, useImperativeHandle, forwardRef } from "react";
import {
  Checkbox,
  Input,
  router,
  useRoute, // ziggy routing
  //
} from "@shared/ui";
const { TextArea } = Input;

const AddRole = forwardRef(
  ({ onClose, permissions, setParentLoading }, ref) => {
    // Group permissions by model (e.g. Branch, User, etc.)
    const modules = useMemo(() => {
      const grouped = {};
      permissions.forEach((perm) => {
        if (!grouped[perm.model]) {
          grouped[perm.model] = [];
        }
        grouped[perm.model].push(perm);
      });
      return grouped;
    }, [permissions]);

    const route = useRoute();
    const defaultValues = {
      name: "",
      notes: "",
      permissions: [],
    };
    const togglePermission = (id) => {
      setValues((prev) => {
        const permissions = prev.permissions.includes(id)
          ? prev.permissions.filter((pid) => pid !== id)
          : [...prev.permissions, id];

        return { ...prev, permissions };
      });
    };
    const isChecked = (id) => values.permissions.includes(id);
    const toggleSelectAll = (modelName) => {
      const perms = modules[modelName].map((p) => p.id);
      const allSelected = perms.every((id) => values.permissions.includes(id));

      setValues((prev) => {
        const updatedPermissions = allSelected
          ? prev.permissions.filter((id) => !perms.includes(id)) // uncheck all
          : [...new Set([...prev.permissions, ...perms])]; // check all

        return { ...prev, permissions: updatedPermissions };
      });
    };
    const isAllSelected = (modelName) =>
      modules[modelName].every((perm) => values.permissions.includes(perm.id));
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState(defaultValues);

    const onChangeValue = (key, value) => {
      setValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

    const handleSubmit = () => {
      setLoading(true);
      setParentLoading?.(true);
      router.post(route("role.store"), values, {
        preserveScroll: true,
        onSuccess: () => {
          setValues(defaultValues);
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
        <div className="container">
          <hr className="mb-3 mt-0" />
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="d-flex align-content-center mb-2">
                <label
                  htmlFor="role"
                  className="me-1"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Enter Role:
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                  <hr className="mt-0 mb-1" />
                </label>
                <Input
                  value={values.name}
                  onChange={(e) => onChangeValue("name", e.target.value)}
                  placeholder="Enter Role Name"
                  allowClear
                />
              </div>
              <div>Add Permission To Role:</div>
              <hr className="mt-1" />
            </div>
            <div className="col-md-6">
              <div className="d-flex flex-column mb-1">
                <label htmlFor="notes">Notes:</label>
                <TextArea
                  value={values.notes}
                  onChange={(e) => onChangeValue("notes", e.target.value)}
                />
              </div>
            </div>
          </div>
          <hr />
          <div
            style={{
              columnCount: 4,
              columnGap: "1rem",
            }}
          >
            {Object.entries(modules).map(([modelName, perms]) => (
              <div
                key={modelName}
                style={{
                  breakInside: "avoid",
                  background: "#f8f8f8",
                  padding: "10px",
                  marginBottom: "1rem",
                  borderRadius: "8px",
                }}
              >
                <h6 style={{ color: "#1890ff" }}>Module: {modelName}</h6>
                <Checkbox
                  checked={isAllSelected(modelName)}
                  onChange={() => toggleSelectAll(modelName)}
                >
                  Select All
                </Checkbox>
                <ul
                  style={{
                    listStyleType: "circle",
                    paddingLeft: "1.5rem",
                  }}
                >
                  {perms.map((perm) => (
                    <li key={perm.id}>
                      <Checkbox
                        checked={isChecked(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      >
                        {perm.name}
                      </Checkbox>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
);
export default AddRole;
