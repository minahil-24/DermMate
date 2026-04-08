import NotificationInboxPage from '../../components/common/NotificationInboxPage'

const AdminAlerts = () => (
  <NotificationInboxPage
    breadcrumbItems={[{ label: 'Admin' }, { label: 'Notifications' }]}
    subtitle="Certificate uploads and system alerts for administrators"
  />
)

export default AdminAlerts
