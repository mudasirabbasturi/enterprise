import {
  useState,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useRef,
} from "react";
import {
  router,
  useRoute, // ziggy routing
  Input,
  Select,
} from "@shared/ui";
import html2canvas from "html2canvas";

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

const GenerateJobLetter = forwardRef(
  ({ data, onClose, setParentLoading }, ref) => {
    const route = useRoute();
    const today = new Date();
    const formattedDate = `${
      today.getMonth() + 1
    }/${today.getDate()}/${today.getFullYear()}`;

    const initialContent = useMemo(
      () => `
        <h3><strong>Job Letter From BidWinner's.LLC</strong></h3>
        <hr>
        <div><strong>Issue Date</strong>: ${formattedDate}</div>
        <div><strong>Name</strong>: ${data.name}</div>
        <div><strong>Phone</strong>: ${data.phone}</div>
        <div><strong>Email</strong>: ${data.email}</div>
        <hr>
        <p>Dear ${data.name},</p>
        <p>
          We are pleased to offer you the part-time student employment position of [job title] 
          at [department name] with a start date of [start date], contingent upon [background check, I-9 form, etc.]. 
          You will be reporting directly to [manager/supervisor name] at [workplace location]. 
          We believe your skills and experience are an excellent match for our department.
        </p>
        <p>
          In this role, you will be required to [briefly mention relevant job duties and responsibilities].
        </p>
        <p>
          The hourly rate for this position is [dollar amount] to be paid on a bi-weekly basis 
          by a check unless you set up direct deposit.
        </p>
        <p>
          Your employment with [Department Name] will be on an at-will basis, which means you and the department 
          are free to terminate the employment relationship at any time for any reason. 
          This letter is not a contract or guarantee of employment for a definite amount of time.
        </p>
        <p>
          As a part-time student employee of Pepperdine, you are covered under Pepperdine's 
          worker compensation insurance and are eligible to accrue sick time.
        </p>
        <p>
          Please confirm your acceptance of this offer by signing and returning this letter by [offer expiration date].
        </p>
        <p>
          We are excited to have you join our team! If you have any questions, 
          please feel free to reach out at any time. 
          <br><br>
          Sincerely,
          <br>[Your Signature]
          <br>[Your Printed Name]
          <br>[Your Job Title]
          <br>
          Signature: ___________________________
          <br>
          Printed Name: ___________________________
          <br>
          Date: __________________________________
        </p>
      `,
      []
    );

    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState({
      job_letter_content: initialContent,
    });

    const pdfRef = useRef(null);

    const onChangeValue = (key, value) => {
      setValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    };
    const handleSubmit = async () => {
      setLoading(true);
      setParentLoading?.(true);

      try {
        const element = pdfRef.current;
        if (!element) throw new Error("PDF element not found");
        element.style.overflow = "visible";

        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
        });
        const image = canvas.toDataURL("image/png", 1.0);
        // Send the image to backend via Inertia router.put
        router.put(
          route("generate.jobletter", data.id),
          {
            ...values,
            image: image, // send base64 string
          },
          {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: () => setLoading(false),
            onFinish: () => setLoading(false),
          }
        );
      } catch (error) {
        console.error("Error generating job letter:", error);
      } finally {
        setLoading(false);
        setParentLoading?.(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submitForm: handleSubmit,
    }));

    return (
      <div className="container-fluid">
        <div className="row">
          {/* Editor side */}
          <div className="col-md-6 col-12 m-0 p-0">
            <Editor
              initialValue={initialContent}
              onEditorChange={(content) => {
                onChangeValue("job_letter_content", content);
              }}
              disabled={loading}
              init={{
                height: "100%",
                menubar: false,
                plugins: "table code lists link",
                toolbar:
                  "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",
                block_formats:
                  "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3",
                skin: false,
                content_css: false,
                content_style: `
                  body, body * {
                    font-family: "Adobe Clean Regular", sans-serif !important;
                  }
                  body {
                    font-size: 14px;
                    line-height: 1.5;
                    color: #333;
                  }
                  h1, h2, h3, h4, h5, h6 {
                    font-family: "Adobe Clean Regular", sans-serif !important;
                  }
                  table, table * {
                    font-family: "Adobe Clean Regular", sans-serif !important;
                  }
                `,
                font_family_formats:
                  "Adobe Clean Regular=Adobe Clean Regular, sans-serif",
              }}
            />
          </div>
          <div className="col-md-6 col-12 border p-1 rounded" ref={pdfRef}>
            <div className="p-5">
              <div
                dangerouslySetInnerHTML={{
                  __html: values.job_letter_content,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default GenerateJobLetter;
