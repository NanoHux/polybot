import { useEffect } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
  Layout,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
  theme,
} from 'antd';
import {
  LineChartOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useDataStore } from './store/useDataStore';
import { MarketAprChart, RewardsChart } from './components/Charts';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function App() {
  const {
    dashboard,
    markets,
    orders,
    loading,
    error,
    fetchAll,
    startBot,
    stopBot,
  } = useDataStore();

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
          colorBgContainer: '#141414',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#000' }}>
        <Header
          style={{
            background: '#141414',
            borderBottom: '1px solid #303030',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SafetyCertificateOutlined
              style={{ fontSize: '24px', color: '#1890ff' }}
            />
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              Polybot AI Agent
            </Title>
          </div>
          <Space>
            <Tag color={dashboard?.running ? 'success' : 'error'}>
              {dashboard?.running ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
            </Tag>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchAll()}
              loading={loading}
            />
          </Space>
        </Header>

        <Content style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {error && (
              <Alert
                message="System Alert"
                description={error}
                type="error"
                showIcon
                closable
              />
            )}

            {/* Top Stats Row */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} hoverable>
                  <Statistic
                    title={<Text type="secondary">Total Equity (USDC)</Text>}
                    value={dashboard?.totalEquity ?? 0}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} hoverable>
                  <Statistic
                    title={<Text type="secondary">Total Rewards</Text>}
                    value={dashboard?.totalRewards ?? 0}
                    precision={4}
                    prefix={<RiseOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} hoverable>
                  <Statistic
                    title={<Text type="secondary">Unrealized PnL</Text>}
                    value={dashboard?.unrealizedPnl ?? 0}
                    precision={2}
                    prefix="$"
                    valueStyle={{
                      color:
                        (dashboard?.unrealizedPnl ?? 0) >= 0
                          ? '#52c41a'
                          : '#ff4d4f',
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} hoverable>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text type="secondary">Bot Control</Text>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={startBot}
                        disabled={dashboard?.running}
                        block
                      >
                        Start
                      </Button>
                      <Button
                        danger
                        icon={<PauseCircleOutlined />}
                        onClick={stopBot}
                        disabled={!dashboard?.running}
                        block
                      >
                        Stop
                      </Button>
                    </Space>
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Liquidity Rewards Trends" bordered={false}>
                  <RewardsChart />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Market APR Analysis" bordered={false}>
                  <MarketAprChart />
                </Card>
              </Col>
            </Row>

            {/* Markets & Orders Row */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={14}>
                <Card
                  title={
                    <Space>
                      <LineChartOutlined />
                      <span>Active Markets</span>
                      <Tag color="blue">{markets.length}</Tag>
                    </Space>
                  }
                  bordered={false}
                >
                  <List
                    dataSource={markets}
                    loading={loading}
                    pagination={{ pageSize: 5 }}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Tag color="cyan" key="min">
                            Min: {item.minIncentiveSize ?? 'N/A'}
                          </Tag>,
                          <Tag color="purple" key="spread">
                            Spread: {item.maxIncentiveSpread ?? 'N/A'}
                          </Tag>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                background: '#1f1f1f',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#1890ff',
                                fontWeight: 'bold',
                              }}
                            >
                              {item.marketId.slice(0, 2)}
                            </div>
                          }
                          title={
                            <Text strong style={{ color: '#e6f7ff' }}>
                              {item.question ?? `Market ${item.marketId}`}
                            </Text>
                          }
                          description={
                            <Space size="small">
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ID: {item.marketId}
                              </Text>
                              <Tag
                                color={
                                  item.status === 'active' ? 'success' : 'default'
                                }
                                bordered={false}
                              >
                                {item.status}
                              </Tag>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>

              <Col xs={24} lg={10}>
                <Card
                  title={
                    <Space>
                      <span>Live Orders</span>
                      <Tag color="volcano">{orders.length}</Tag>
                    </Space>
                  }
                  bordered={false}
                >
                  <List
                    dataSource={orders}
                    loading={loading}
                    pagination={{ pageSize: 5 }}
                    renderItem={(item) => (
                      <List.Item>
                        <div
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Space direction="vertical" size={0}>
                            <Text strong>
                              {item.side === 'BUY' ? (
                                <span style={{ color: '#52c41a' }}>BUY</span>
                              ) : (
                                <span style={{ color: '#ff4d4f' }}>SELL</span>
                              )}{' '}
                              {item.outcomeId}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              #{item.id} - status: {item.status}
                            </Text>
                          </Space>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                              {item.price}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Size: {item.size}
                            </Text>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
