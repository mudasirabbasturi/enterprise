import React from "react";
import { Layout, Menu, theme, usePage } from "@shared/ui";
import { useRoute } from "@ziggy";
import { getSidebarItems } from "@component/Sidebar/sidebarItems";
const { Sider } = Layout;
const Sidebar = ({
  collapsed,
  setCollapsed,
  openKeys,
  setOpenKeys,
  savedOpenKeys,
  setSavedOpenKeys,
}) => {
  const route = useRoute();
  const { props } = usePage();
  const user = props.auth.user;
  const permissions = props.permissions;
  const userPermissions = props.auth.user.role.permissions;

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={250}
      style={{ background: colorBgContainer }}
      className="sidebar pt-4"
    >
      <Menu
        mode="inline"
        style={{ height: "100%", borderRight: 0 }}
        items={getSidebarItems({
          route,
          user,
          permissions,
          userpermission: userPermissions,
        })}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
      />
    </Sider>
  );
};

export default Sidebar;
