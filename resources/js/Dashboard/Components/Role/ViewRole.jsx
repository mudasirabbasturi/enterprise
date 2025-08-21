import { useMemo } from "react";
import { Checkbox, Input, Typography } from "@shared/ui";
const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const ViewRole = ({ data, permissions }) => {
  // Group permissions by module
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

  // Extract permission IDs assigned to role
  const assignedIds = data?.permissions?.map((p) => p.id) ?? [];

  const isChecked = (id) => assignedIds.includes(id);

  return (
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
              value={data.name}
              disabled
              placeholder="Enter Role Name"
              allowClear={false}
            />
          </div>
          <div className="mb-2">
            <Title level={5}>Permissions Assigned to Role</Title>
            <Paragraph type="secondary">
              Checked = Assigned, Unchecked = Not Assigned & Total Granted
              Permission: {data.permissions.length}
            </Paragraph>
          </div>
          <hr className="mt-0" />
        </div>
        <div className="col-md-6">
          <div className="d-flex flex-column mb-1">
            <label htmlFor="notes">Notes:</label>
            <TextArea value={data.notes} disabled />
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
            <ul
              style={{
                listStyleType: "circle",
                paddingLeft: "1.5rem",
              }}
            >
              {perms.map((perm) => (
                <li key={perm.id}>
                  <Checkbox checked={isChecked(perm.id)} disabled>
                    {perm.name}
                  </Checkbox>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewRole;
