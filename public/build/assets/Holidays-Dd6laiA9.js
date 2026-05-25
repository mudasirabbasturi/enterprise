import{r,j as e,Q as g,t as H,S as k}from"./vendor-react-C2xqwMw4.js";import{D as N}from"./app-Bf4ugdt9.js";import C from"./HolidayForm-CW8F7y6n.js";import{s as D,H as M,aa as S,M as Y,P as v,O as w}from"./vendor-antd-DojYAy1L.js";import{a_ as m}from"./vendor-Ca2vlWXu.js";import"./vendor-inertia-DLoN6V7S.js";import"./vendor-chart-DwXpjXxm.js";const E=({holidays:l})=>{const[i,f]=D.useNotification(),[p,a]=r.useState(!1),[s,d]=r.useState(null),[x,u]=r.useState(m()),c=r.useRef(),b=t=>{k.delete(route("holidays.destroy",t),{onSuccess:()=>{i.success({message:"Holiday deleted successfully"}),a(!1)},onError:n=>{n.error&&i.error({message:n.error})}})},h=t=>{const n=t.format("YYYY-MM-DD"),j=l.filter(o=>m(o.date).format("YYYY-MM-DD")===n);return e.jsx("ul",{className:"list-unstyled m-0 p-0",children:j.map(o=>e.jsx("li",{onClick:y=>{y.stopPropagation(),d(o),a(!0)},children:e.jsx(w,{status:"warning",text:o.title,className:"small-badge"})},o.id))})};return e.jsxs(e.Fragment,{children:[f,e.jsx(g,{title:"Holidays Calendar"}),e.jsxs("div",{className:"container-fluid p-3",children:[e.jsxs("div",{className:"d-flex justify-content-between align-items-center mb-4",children:[e.jsx(M,{items:[{title:e.jsx(H,{href:"/",children:"Home"})},{title:"Leave Management"},{title:"Holidays"}]}),e.jsx("button",{className:"btn btn-primary btn-sm d-flex align-items-center",onClick:()=>{d(null),u(m()),a(!0)},children:"Add Holiday"})]}),e.jsx("div",{className:"bg-white p-4 rounded shadow-sm border",children:e.jsx(S,{cellRender:h,onSelect:(t,{source:n})=>{n==="date"&&(d(null),u(t),a(!0))}})})]}),e.jsx(Y,{title:s?"Edit Holiday":"Add Holiday",open:p,onOk:()=>{var t;return(t=c.current)==null?void 0:t.submitForm()},onCancel:()=>a(!1),width:500,centered:!0,footer:[s&&e.jsx(v,{title:"Delete this holiday?",onConfirm:()=>b(s.id),okText:"Yes",cancelText:"No",okButtonProps:{danger:!0},children:e.jsx("button",{className:"btn btn-danger btn-sm float-start",children:"Delete"})},"delete"),e.jsx("button",{className:"btn btn-light btn-sm me-2",onClick:()=>a(!1),children:"Cancel"},"back"),e.jsx("button",{className:"btn btn-primary btn-sm",onClick:()=>{var t;return(t=c.current)==null?void 0:t.submitForm()},children:s?"Update":"Save"},"submit")],children:e.jsx("div",{className:"mt-3",children:e.jsx(C,{ref:c,initialValues:s||{date:x},mode:s?"edit":"add",onClose:()=>a(!1),notificationApi:i})})}),e.jsx("style",{children:`
                .small-badge .ant-badge-status-text {
                    font-size: 11px;
                    font-weight: 600;
                    color: #d46b08;
                }
                .ant-picker-calendar-date-content {
                    height: 80px !important;
                    overflow-y: auto;
                }
                .ant-picker-calendar-date-content li {
                    background: #fffbe6;
                    border: 1px solid #ffe58f;
                    border-radius: 4px;
                    padding: 2px 4px;
                    margin-bottom: 2px;
                    cursor: pointer;
                }
                .ant-picker-calendar-date-content li:hover {
                    background: #fff1b8;
                }
            `})]})};E.layout=l=>e.jsx(N,{children:l});export{E as default};
