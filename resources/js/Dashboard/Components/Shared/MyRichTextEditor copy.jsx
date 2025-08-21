import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Editor } from "@tinymce/tinymce-react";
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/table";
import "tinymce/plugins/code";
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/skins/ui/oxide/skin.css";

const MyRichTextEditor = forwardRef(({ value, onValueChange }, ref) => {
  const editorRef = useRef();
  useEffect(() => {
    setTimeout(() => {
      editorRef.current?.editor?.focus();
    }, 100);
  }, []);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      return editorRef.current?.getContent?.() || "";
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
      }}
    >
      <Editor
        onInit={(evt, editor) => {
          editorRef.current = editor;
        }}
        initialValue={value || ""}
        init={{
          height: "100%",
          width: "100%",
          menubar: false,
          plugins: "table code lists link",
          toolbar:
            "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
          skin: false,
          content_css: false,
        }}
        onEditorChange={(content) => {
          onValueChange?.(content);
        }}
      />
    </div>
  );
});

export default MyRichTextEditor;
