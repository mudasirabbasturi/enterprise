import "./bootstrap";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import MainLayout from "@layout";

createInertiaApp({
  resolve: async (name) => {
    const pages = import.meta.glob("./Dashboard/**/*.jsx");
    const importPage = pages[`./Dashboard/${name}.jsx`];

    if (!importPage) {
      throw new Error(`Unknown page ${name}. Is the file path correct?`);
    }
    const module = await importPage();
    module.default.layout =
      typeof module.default.layout !== "undefined"
        ? module.default.layout
        : (page) => <MainLayout>{page}</MainLayout>;

    return module;
  },

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
