import React, { useState, useImperativeHandle, forardRef } from "react";
import { useRoute, Tooltip, Collapse, Avatar } from "@shared/ui";
const ViewJoinProject = ({ project }) => {
  const route = useRoute();

  const members = project.project_team_members || [];
  return (
    <>
      <div className="container">
        <div className="row">
          <div className="col-md-8 col-12">
            <hr className="mb-0 mt-0"></hr>
            <div className="mt-1 mb-1">
              <div className="d-flex bg-light p-2 rounded">
                <h6
                  style={{ textDecoration: "underline" }}
                  className="me-2 mb-0"
                >
                  Project Team Member:&nbsp;
                  <Avatar.Group>
                    {members.map((per, index) => (
                      <Tooltip
                        title={per.user?.name || "N/A"}
                        placement="top"
                        key={index}
                      >
                        {per.user?.media?.[0]?.file_path ? (
                          <Avatar
                            style={{
                              marginLeft: index > 0 ? 1 : 0,
                            }}
                            src={`/storage/${per.user.media[0].file_path}`}
                            alt={per.user.name}
                          />
                        ) : (
                          <Avatar
                            style={{
                              backgroundColor: "#1890ff",
                              marginLeft: index > 0 ? 1 : 0,
                            }}
                          >
                            {per.user?.name
                              ? per.user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                              : "U"}
                          </Avatar>
                        )}
                      </Tooltip>
                    ))}
                  </Avatar.Group>
                </h6>
              </div>
            </div>
            <hr className="mb-0 mt-0"></hr>
            <Collapse
              className="mb-3 mt-3"
              items={[
                {
                  key: "1",
                  label: (
                    <>
                      <h6 className="mb-0" style={{ color: "#1890ff" }}>
                        Joined Member, Steps & Details:
                      </h6>
                    </>
                  ),
                  children: (
                    <>
                      <ul style={{ listStyleType: "circle" }}>
                        {members.map((per, index) => {
                          const name = per.user?.name || "Unknown";
                          const steps = per.steps || [];
                          return (
                            <>
                              <li key={index}>
                                <strong>{name}</strong>
                                <li
                                  style={{
                                    fontWeight: "600",
                                    textDecoration: "underline",
                                    listStyleType: "none",
                                  }}
                                >
                                  Project Steps:
                                </li>
                                <ul
                                  style={{
                                    listStyleType: "square",
                                    paddingLeft: 20,
                                  }}
                                >
                                  {Array.isArray(steps) && steps.length > 0 ? (
                                    steps.map((step, stepIndex) => (
                                      <li key={stepIndex}>{step}</li>
                                    ))
                                  ) : (
                                    <li>No steps</li>
                                  )}
                                </ul>
                                <li
                                  style={{
                                    fontWeight: "600",
                                    textDecoration: "underline",
                                    listStyleType: "none",
                                  }}
                                >
                                  More Details:
                                </li>
                                <ul
                                  style={{
                                    listStyleType: "square",
                                    paddingLeft: 20,
                                  }}
                                >
                                  <li>
                                    Started At:{" "}
                                    {per.started_at
                                      ? new Date(
                                          per.started_at
                                        ).toLocaleDateString()
                                      : "—"}
                                  </li>
                                  <li>
                                    Completed At:{" "}
                                    {per.completed_at
                                      ? new Date(
                                          per.completed_at
                                        ).toLocaleDateString()
                                      : "—"}
                                  </li>
                                  <li>
                                    Duration:{" "}
                                    {per.completed_at && per.started_at
                                      ? `${Math.round(
                                          (new Date(per.completed_at) -
                                            new Date(per.started_at)) /
                                            (1000 * 60 * 60 * 24)
                                        )} days`
                                      : "Not completed yet"}
                                  </li>
                                  <li>Status: {per.status ?? "—"}</li>
                                  <li>
                                    Points Gained: {per.points_gain ?? "—"}
                                  </li>
                                  <li>Notes: {per.notes ?? "—"}</li>
                                </ul>
                              </li>
                              <hr />
                            </>
                          );
                        })}
                      </ul>
                      <hr />
                      <li>
                        Details: ? <br></br>
                        Place holder .....
                      </li>
                    </>
                  ),
                },
              ]}
              size="small"
              defaultActiveKey={["1"]}
            />
          </div>
          <div className="col-md-4 col-12">
            <hr className="mb-2 mt-0"></hr>
            <div className="mt-1 mb-1">
              <div className="d-flex bg-light p-2 rounded">
                <h6
                  style={{ textDecoration: "underline" }}
                  className="me-2 mb-0"
                >
                  Project Points And Team Member Score:
                </h6>
              </div>
            </div>
            <hr className="mb-2 mt-2"></hr>
            <ul style={{ listStyle: "circle", fontStyle: "italic" }}>
              <li>Total Project Points: {project.project_points || 0}</li>
              <li>
                Total Point Used:{" "}
                {members.reduce(
                  (total, member) => total + (Number(member.points_gain) || 0),
                  0
                )}
              </li>
              <li>
                Total Point Left:{" "}
                {(project.project_points || 0) -
                  members.reduce(
                    (total, member) =>
                      total + (Number(member.points_gain) || 0),
                    0
                  )}
              </li>
            </ul>
            {members.map((member, index) => (
              <div
                key={member.id || index}
                className="mt-2 mb-2 d-flex flex-column"
              >
                <span>{member.user?.name || "Unknown"}</span>
                {member.points_gain && (
                  <small className="text-muted ms-1 border border-start-0 border-end-0 border-top-0 border-warning">
                    Current: {member.points_gain} points
                  </small>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
export default ViewJoinProject;
