import { Layout, Menu } from 'antd'
import { SwapOutlined, SoundOutlined, TableOutlined } from '@ant-design/icons'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

const { Header, Content, Footer } = Layout

export default function AppLayout() {
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <SwapOutlined />,
      label: <Link to="/">摩斯互转</Link>,
    },
    {
      key: '/practice',
      icon: <SoundOutlined />,
      label: <Link to="/practice">听码练习</Link>,
    },
    {
      key: '/对照表',
      icon: <TableOutlined />,
      label: <Link to="/对照表">对照表</Link>,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginRight: 40 }}>
          摩斯电码
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ padding: '24px 48px' }}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        摩斯电码互转与听码练习 · React + Vite + TypeScript
      </Footer>
    </Layout>
  )
}
