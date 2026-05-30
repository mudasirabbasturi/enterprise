import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect
} from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const MyRichTextEditor = forwardRef(({ value, onValueChange }, ref) => {
  const [content, setContent] = useState(value || "");

  useEffect(() => {
    setContent(value || "");
  }, [value]);

  const handleChange = (newContent) => {
    setContent(newContent);
    if (onValueChange) {
      onValueChange(newContent);
    }
  };

  useImperativeHandle(ref, () => ({
    getValue: () => {
      return content;
    },
  }));

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link", "code-block"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "code-block",
  ];

  return (
    <div
      style={{
        width: 500,
        height: 300,
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        margin: "auto",
        backgroundColor: "white", // ensure background is white
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ReactQuill
        theme="snow"
        value={content}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        style={{ height: "calc(100% - 42px)", marginBottom: "42px" }}
      />
    </div>
  );
});

export default React.memo(MyRichTextEditor);
