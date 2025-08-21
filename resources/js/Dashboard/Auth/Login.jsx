import { useEffect } from "react";
import {
  usePage,
  useForm, // InertiaJS
  Input,
  Button,
  notification,
  Card,
  Divider,
  Typography,
  LockOutlined,
  MailOutlined,
  ArrowRightOutlined,
  GoogleOutlined,
  FacebookOutlined,
  TwitterOutlined,
} from "@shared/ui";

const { Title, Text } = Typography;
const Login = () => {
  const { data, setData, post } = useForm({
    email: "",
    password: "",
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    post("/login");
  };

  // Flash Messages
  const { flash, errors } = usePage().props;
  const [api, contextHolder] = notification.useNotification();
  useEffect(() => {
    if (flash.message) {
      api.success({
        message: "Success",
        description: flash.message,
        placement: "topRight",
      });
    }
  }, [flash]);
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, messages]) => {
        const errorText = Array.isArray(messages)
          ? messages.join(", ")
          : messages;
        api.error({
          message: "Validation Error",
          description: errorText,
          placement: "topRight",
        });
      });
    }
  }, [errors]);
  return (
    <>
      {contextHolder}
      <div
        className="login-container"
        style={{
          background: "linear-gradient(135deg, #963b06ff 0%, #764ba2 100%)",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <Card
          hoverable
          style={{
            width: "100%",
            maxWidth: "450px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Title level={3} style={{ color: "#1890ff", marginBottom: "8px" }}>
              Welcome Back
            </Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>
          <form onSubmit={handleSubmit}>
            <fieldset className="border rounded ps-4 pe-4 pb-4">
              <legend className="float-none w-auto p-2">Login</legend>
              <label htmlFor="email">
                Your Email:
                <hr className="m-0" />
              </label>
              <Input
                prefix={<MailOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                size="large"
                className="mb-2"
                type="email"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
                placeholder="Email"
                allowClear
              />
              <label htmlFor="password">
                Your Password:
                <hr className="m-0" />
              </label>
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                size="large"
                className="mb-2"
                type="password"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                placeholder="Password"
                autoComplete="new-password"
                allowClear
              />
              <Button
                className="mb-3"
                type="primary"
                htmlType="submit"
                size="large"
                block
                icon={<ArrowRightOutlined />}
                style={{ height: "45px", fontWeight: "500" }}
              >
                Sign In
              </Button>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <a style={{ color: "#1890ff" }}>Forgot password?</a>
              </div>

              <Divider plain style={{ color: "#8c8c8c" }}>
                Or continue with
              </Divider>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "16px",
                }}
              >
                <Button shape="circle" icon={<GoogleOutlined />} />
                <Button shape="circle" icon={<FacebookOutlined />} />
                <Button shape="circle" icon={<TwitterOutlined />} />
              </div>
            </fieldset>
          </form>
        </Card>
      </div>
    </>
  );
};
Login.layout = null;
export default Login;
