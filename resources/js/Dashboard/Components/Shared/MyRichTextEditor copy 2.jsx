import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { Editor } from "@tinymce/tinymce-react";

const MyRichTextEditor = forwardRef(({ value, onValueChange }, ref) => {
  const editorRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      return editorRef.current?.getContent() || "";
    },
    focus: () => {
      editorRef.current?.focus();
    },
  }));

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
        zIndex: 1000,
        backgroundColor: "white",
      }}
    >
      <Editor
        tinymceScriptSrc="/path/to/tinymce/tinymce.min.js"
        onInit={(evt, editor) => {
          editorRef.current = editor;
        }}
        value={value}
        init={{
          height: "100%",
          width: "100%",
          menubar: false,
          plugins: "table code lists link",
          toolbar:
            "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
          skin: false,
          content_css: false,
          setup: (editor) => {
            editor.on("init", () => {
              editor.focus();
            });
          },
        }}
        onEditorChange={(content) => {
          onValueChange?.(content);
        }}
      />
    </div>
  );
});

export default MyRichTextEditor;
