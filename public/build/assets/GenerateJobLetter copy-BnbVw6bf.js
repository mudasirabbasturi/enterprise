import{r as n,C as w,j as t,S as j}from"./app-BNvUUmEl.js";import{h as x}from"./html2canvas.esm-BfYXEYrK.js";import{E as k}from"./Editor-CDggPmT6.js";import"./skin-DY8BMAJN.js";const D=n.forwardRef(({data:o,onClose:u,setParentLoading:r},p)=>{const f=w(),l=new Date,h=`${l.getMonth()+1}/${l.getDate()}/${l.getFullYear()}`,_=n.useMemo(()=>`
        <h3><strong>Job Letter From BidWinner's.LLC</strong></h3>
        <hr>
        <div><strong>Issue Date</strong>: ${h}</div>
        <div><strong>Name</strong>: ${o.name}</div>
        <div><strong>Phone</strong>: ${o.phone}</div>
        <div><strong>Email</strong>: ${o.email}</div>
        <hr>
        <p>Dear ${o.name},</p>
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
      `,[]),[b,i]=n.useState(!1),[c,g]=n.useState({job_letter_content:_}),m=n.useRef(null),y=(e,d)=>{g(s=>({...s,[e]:d}))},v=async()=>{i(!0),r==null||r(!0);try{const e=m.current;if(!e)throw new Error("PDF element not found");e.style.overflow="visible";const s=(await x(e,{scale:2,logging:!1,useCORS:!0,allowTaint:!0,scrollX:0,scrollY:0})).toDataURL("image/png",1),a=document.createElement("a");a.href=s,a.download=`Job-Letter-${o.name||"candidate"}.png`,document.body.appendChild(a),a.click(),document.body.removeChild(a),j.put(f("generate.jobletter",o.id),c,{preserveScroll:!0,onSuccess:()=>{u()},onError:()=>{i(!1)},onFinish:()=>{i(!1)}})}catch(e){console.error("Error generating job letter:",e)}finally{i(!1),r==null||r(!1)}};return n.useImperativeHandle(p,()=>({submitForm:v})),t.jsx("div",{className:"container-fluid",children:t.jsxs("div",{className:"row",children:[t.jsx("div",{className:"col-md-6 col-12 m-0 p-0",children:t.jsx(k,{initialValue:_,onEditorChange:e=>{y("job_letter_content",e)},disabled:b,init:{height:"100%",menubar:!1,plugins:"table code lists link",toolbar:"undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code",block_formats:"Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3",skin:!1,content_css:!1,content_style:`
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
                `,font_family_formats:"Adobe Clean Regular=Adobe Clean Regular, sans-serif"}})}),t.jsx("div",{className:"col-md-6 col-12 border p-1 rounded",ref:m,children:t.jsx("div",{className:"p-5",children:t.jsx("div",{dangerouslySetInnerHTML:{__html:c.job_letter_content}})})})]})})});export{D as default};
