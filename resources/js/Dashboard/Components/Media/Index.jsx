import React, { useState, useEffect } from "react";
import {
  router,
  useRoute,
  UploadOutlined,
  Upload,
  Button,
  message,
  FilePdfOutlined,
  FileOutlined,
  DeleteOutlined,
  Tooltip,
  Popconfirm,
  usePage,
} from "@shared/ui";

// Utility to detect file type
const getFileType = (url) => {
  if (!url) return "unknown";
  const ext = url.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext))
    return "image";
  if (ext === "pdf") return "pdf";
  return "other";
};

const Index = ({ ownerId }) => {
  const hasPermission = (userpermission, permName) =>
    userpermission?.some((p) => p.name === permName);

  const route = useRoute();

  const currentRouteName = route().current();
  const { props } = usePage();
  const userPermissions = props.auth.user?.role?.permissions || [];
  const can = (perm) => hasPermission(userPermissions, perm);

  const [uploadingCategory, setUploadingCategory] = useState(null);

  const [profileUrl, setProfileUrl] = useState(null);
  const [idCardFrontUrl, setIdCardFrontUrl] = useState(null);
  const [idCardBackUrl, setIdCardBackUrl] = useState(null);
  const [cvUrl, setCvUrl] = useState(null);
  const [reloadMedia, setReloadMedia] = useState(0);

  const [profileFileList, setProfileFileList] = useState([]);
  const [frontFileList, setFrontFileList] = useState([]);
  const [backFileList, setBackFileList] = useState([]);
  const [cvFileList, setCvFileList] = useState([]);

  const [otherFileList, setOtherFileList] = useState([]);

  const [media, setMedia] = useState([]);

  useEffect(() => {
    if (!ownerId) return;

    axios
      .get(route("media.index", { id: ownerId }))
      .then((response) => {
        const profilePath = response.data.profile?.file_path;
        const idCardFrontPath = response.data.idCardFront?.file_path;
        const idCardBackPath = response.data.idCardBack?.file_path;
        const resumePath = response.data.resume?.file_path;

        setProfileUrl(profilePath ? `/storage/${profilePath}` : null);
        setIdCardFrontUrl(
          idCardFrontPath ? `/storage/${idCardFrontPath}` : null
        );
        setIdCardBackUrl(idCardBackPath ? `/storage/${idCardBackPath}` : null);
        setCvUrl(resumePath ? `/storage/${resumePath}` : null);

        const mediaList = response.data.media || [];
        setMedia(mediaList);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [ownerId, reloadMedia]);

  const handleUpload = (category, filesSetter, fileList) => {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("file", file);
    });
    formData.append("user_id", ownerId);
    formData.append("category", category);

    setUploadingCategory(category);
    router.post(route("media.upload"), formData, {
      preserveScroll: true,
      onSuccess: () => {
        filesSetter([]);
        setReloadMedia((prev) => prev + 1);
      },
      onError: () => filesSetter([]),
      onFinish: () => {
        setUploadingCategory(null);
      },
    });
  };

  // Popconfirm Media Delete
  const confirmDelMedia = (id) =>
    new Promise((resolve) => {
      const url = route("media.destroy", id);
      router.delete(url, {
        preserveScroll: true,
        onSuccess: () => {
          setReloadMedia((prev) => prev + 1);
          resolve();
        },
        onError: () => {
          message.error("Failed to delete department");
        },
      });
    });

  const renderUploadSection = ({
    title,
    fileUrl,
    defaultImg,
    fileList,
    setFileList,
    category,
  }) => {
    const fileType = getFileType(fileUrl);

    return (
      <div
        className={`col-12 ${
          currentRouteName === "user.profile" ? "col-md-4" : "col-md-3"
        } d-flex flex-column justify-content-between mb-1`}
      >
        <figure
          className="d-flex justify-content-center align-items-center"
          style={{
            height: "auto",
            border: "1px solid #ccc",
            padding: "6px",
            maxHeight: "200px",
            minHeight: "150px",
            overflow: "hidden",
          }}
        >
          {fileUrl && fileType === "image" ? (
            <img
              src={fileUrl}
              alt={title}
              style={
                category === "profile"
                  ? {
                      width: "150px",
                      height: "150px",
                      borderRadius: "50%",
                      objectFit: "contain",
                    }
                  : { width: "100%", objectFit: "contain" }
              }
            />
          ) : fileUrl && fileType === "pdf" ? (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <FilePdfOutlined
                style={{
                  fontSize: "40px",
                  color: "#d32f2f",
                }}
              />
            </a>
          ) : fileUrl ? (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <FileOutlined
                style={{
                  fontSize: "40px",
                  color: "#555",
                }}
              />
            </a>
          ) : (
            <img src={defaultImg} alt={title} style={{ width: "100%" }} />
          )}
        </figure>
        <div className="d-flex flex-column">
          <Upload
            fileList={fileList}
            onRemove={(file) => {
              const newList = [...fileList];
              newList.splice(fileList.indexOf(file), 1);
              setFileList(newList);
            }}
            beforeUpload={(file) => {
              setFileList([...fileList, file]);
              return false;
            }}
          >
            <Tooltip
              title={
                fileUrl
                  ? !can("Update Media")
                    ? "You do not have permission to update"
                    : ""
                  : !can("Upload Media")
                  ? "You do not have permission to upload"
                  : ""
              }
              color="red"
              placement="top"
            >
              <Button
                icon={<UploadOutlined />}
                disabled={
                  fileUrl
                    ? !can("Update Media") // needs update permission
                    : !can("Upload Media") // needs upload permission
                }
              >
                {fileUrl
                  ? category === "profile"
                    ? "Update Profile"
                    : category === "resume"
                    ? "Update CV"
                    : category === "id_card_front"
                    ? "Update ID Card Front"
                    : category === "id_card_back"
                    ? "Update ID Card Back"
                    : "Upload Again"
                  : "Select File"}
              </Button>
            </Tooltip>
          </Upload>
          <Button
            className="mt-1"
            type="primary"
            onClick={() => handleUpload(category, setFileList, fileList)}
            disabled={fileList.length === 0}
            loading={uploadingCategory === category}
          >
            {uploadingCategory === category ? "Uploading..." : "Start Upload"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid">
      {/* {contextHolder} */}
      <div className="row">
        {renderUploadSection({
          title: "User Profile",
          fileUrl: profileUrl,
          defaultImg: "/storage/uploads/media/default/profile.svg",
          fileList: profileFileList,
          setFileList: setProfileFileList,
          category: "profile",
        })}
        {renderUploadSection({
          title: "ID Card Front",
          fileUrl: idCardFrontUrl,
          defaultImg: "/storage/uploads/media/default/id_card_front.svg",
          fileList: frontFileList,
          setFileList: setFrontFileList,
          category: "id_card_front",
        })}
        {renderUploadSection({
          title: "ID Card Back",
          fileUrl: idCardBackUrl,
          defaultImg: "/storage/uploads/media/default/id_card_back.svg",
          fileList: backFileList,
          setFileList: setBackFileList,
          category: "id_card_back",
        })}
        {renderUploadSection({
          title: "Resume",
          fileUrl: cvUrl,
          defaultImg: "/storage/uploads/media/default/cv.svg",
          fileList: cvFileList,
          setFileList: setCvFileList,
          category: "resume",
        })}
      </div>
      <hr />
      <div className="row mb-3">
        <div className="col-12">
          <h6>All & Other</h6>
        </div>
        <div
          className={`${
            currentRouteName === "user.profile" ? "col-md-3" : "col-md-2"
          } col-6`}
        >
          <div className="d-flex flex-column">
            {can("Upload Media") ? (
              <Upload
                fileList={otherFileList}
                onRemove={(file) => {
                  const newList = [...otherFileList];
                  newList.splice(otherFileList.indexOf(file), 1);
                  setOtherFileList(newList);
                }}
                beforeUpload={(file) => {
                  setOtherFileList([...otherFileList, file]);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload Other</Button>
              </Upload>
            ) : (
              <Tooltip
                title="You don't have permission to upload media"
                color="red"
                placement="top"
              >
                <Button icon={<UploadOutlined />}>Upload Other</Button>
              </Tooltip>
            )}

            <Button
              className="mt-1"
              type="primary"
              onClick={() =>
                handleUpload("other", setOtherFileList, otherFileList)
              }
              disabled={otherFileList.length === 0}
              loading={uploadingCategory === "other"}
            >
              {uploadingCategory === "other" ? "Uploading..." : "Start Upload"}
            </Button>
          </div>
        </div>
      </div>
      <div className="row">
        {media.map((item, index) => {
          const fileUrl = `/storage/${item.file_path}`;
          const fileType = getFileType(fileUrl);
          const category = item.category;
          return (
            <div
              className={`col-12 ${
                currentRouteName === "user.profile" ? "col-md-4" : "col-md-2"
              }`}
              key={index}
            >
              <figure
                className="d-flex justify-content-center align-items-center"
                style={{
                  border: "1px solid #ccc",
                  position: "relative",
                  marginBottom: "3px",
                  minHeight: "200px",
                }}
              >
                {fileType === "image" ? (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <img
                      src={fileUrl}
                      style={{
                        width: "100%",
                      }}
                      alt={`media-${index}`}
                    />
                    <span>{category}</span>
                  </a>
                ) : fileType === "pdf" ? (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <FilePdfOutlined
                      style={{ fontSize: "40px", color: "#d32f2f" }}
                    />
                    <span>{category}</span>
                  </a>
                ) : (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <FileOutlined
                      style={{ fontSize: "40px", color: "#d32f2f" }}
                    />
                    <span>{category}</span>
                  </a>
                )}
                <div
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                  }}
                >
                  {can("Delete Media") ? (
                    <Tooltip
                      title={`Delete File ${item.category}`}
                      color="red"
                      placement="leftTop"
                    >
                      <Popconfirm
                        title={`Are you sure you want to delete "${item.category}"?`}
                        onConfirm={() => confirmDelMedia(item.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <DeleteOutlined
                          style={{ border: "1px dashed red" }}
                          className="btn btn-sm btn-danger"
                        />
                      </Popconfirm>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title={`You don't have permission to delete`}
                      color="red"
                      placement="leftTop"
                    >
                      <DeleteOutlined
                        style={{ border: "1px dashed red" }}
                        className="btn btn-sm btn-danger"
                      />
                    </Tooltip>
                  )}
                </div>
              </figure>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Index;
