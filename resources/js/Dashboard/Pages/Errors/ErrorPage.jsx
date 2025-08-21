import { usePage } from "@shared/ui";
export default function ErrorPage({ status }) {
  // const { auth } = usePage().props;
  // console.log(auth.permissions);
  // console.log("User Info:", auth.user.name);
  const title =
    {
      503: "503: Service Unavailable",
      500: "500: Server Error",
      404: "404: Page Not Found",
      403: "403: Forbidden",
    }[status] || `${status}: Error`;

  const description =
    {
      503: "Sorry, we are doing some maintenance. Please check back soon.",
      500: "Whoops, something went wrong on our servers.",
      404: "Sorry, the page you are looking for could not be found.",
      403: "Sorry, you are forbidden from accessing this page.",
    }[status] || "An unexpected error occurred.";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center p-6">
      <h1 className="text-4xl font-bold text-red-600 mb-4">{title}</h1>
      <p className="text-lg text-gray-700">{description}</p>
    </div>
  );
}
