import { useEffect, useMemo } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
  Empty,
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
  ClockCircleOutlined,
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

  // 自动轮询：每 10 秒刷新一次数据
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const lastUpdatedLabel = useMemo(() => {
    if (!dashboard?.lastUpdated) return 'Never';
    const d = new Date(dashboard.lastUpdated);
    return d.toLocaleString();
  }, [dashboard?.lastUpdated]);

  const sortedMarkets = useMemo(() => {
    // 按 expectedApr 降序排序，其次按 question
    return [...markets].sort((a, b) => {
      const aprA = a.expectedApr ?? 0;
      const aprB = b.expectedApr ?? 0;
      if (aprA !== aprB) return aprB - aprA;
      return (a.question ?? '').localeCompare(b.question ?? '');
    });
  }, [markets]);

  const systemAlertText = dashboard?.systemAlert ?? error ?? null;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <div>
              <Title level={3} style={{ margin: 0, color: '#fff' }}>
                Polybot AI Agent
              </Title>
              <Space size="small">
                <Tag color={dashboard?.running ? 'success' : 'error'}>
                  {dashboard?.running ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                </Tag>
                <Space size={4}>
                  <ClockCircleOutlined style={{ color: '#999' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Last updated: {lastUpdatedLabel}
                  </Text>
                </Space>
              </Space>
            </div>
          </div>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchAll()}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </Header>

        <Content
          style={{
            padding: '24px',
            width: '100%',
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {systemAlertText && (
              <Alert
                message="System Alert"
                description={systemAlertText}
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
                    <Space
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                      }}
                    >
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
                <Card
                  title="Liquidity Rewards Trends"
                  bordered={false}
                  bodyStyle={{ minHeight: 260 }}
                >
                  {dashboard?.rewardHistory?.length ? (
                    <RewardsChart rewards={dashboard.rewardHistory} />
                  ) : (
                    <Empty description="No rewards history yet" />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title="Market APR Analysis"
                  bordered={false}
                  bodyStyle={{ minHeight: 260 }}
                >
                  {dashboard?.aprSeries?.length ? (
                    <MarketAprChart aprs={dashboard.aprSeries} />
                  ) : (
                    <Empty description="No APR data yet" />
                  )}
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
                      <Tag color="blue">{sortedMarkets.length}</Tag>
                    </Space>
                  }
                  bordered={false}
                >
                  <List
                    dataSource={sortedMarkets}
                    loading={loading}
                    locale={{
                      emptyText: (
                        <Empty description="No active markets" />
                      ),
                    }}
                    pagination={{ pageSize: 5 }}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Tag color="cyan" key="min">
                            Min: {item.minIncentiveSize ?? 'N/A'}
                          </Tag>,
                          <Tag color="purple" key="spread">
                            Spread ≤ {item.maxIncentiveSpread ?? 'N/A'}
                          </Tag>,
                          item.expectedApr != null && (
                            <Tag color="gold" key="apr">
                              APR: {item.expectedApr.toFixed(1)}%
                            </Tag>
                          ),
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
                            <Space size="small">
                              <Text strong style={{ color: '#e6f7ff' }}>
                                {item.question ?? `Market ${item.marketId}`}
                              </Text>
                              <Tag
                                color={
                                  item.status === 'open'
                                    ? 'success'
                                    : item.status === 'resolved'
                                    ? 'default'
                                    : 'processing'
                                }
                                bordered={false}
                                style={{ textTransform: 'uppercase' }}
                              >
                                {item.status}
                              </Tag>
                            </Space>
                          }
                          description={
                            <Space size="small" wrap>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ID: {item.marketId}
                              </Text>
                              {item.myLiquidityShare != null && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  My share:{' '}
                                  {(item.myLiquidityShare * 100).toFixed(2)}%
                                </Text>
                              )}
                              {item.epochEnd && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Epoch ends:{' '}
                                  {new Date(
                                    item.epochEnd
                                  ).toLocaleString()}
                                </Text>
                              )}
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
                    locale={{
                      emptyText: <Empty description="No live orders" />,
                    }}
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
                            {item.question && (
                              <Text
                                type="secondary"
                                style={{ fontSize: 12 }}
                                ellipsis={{ tooltip: item.question }}
                              >
                                {item.question}
                              </Text>
                            )}
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              #{item.id} · status: {item.status} ·{' '}
                              {new Date(item.placedAt).toLocaleString()}
                            </Text>
                          </Space>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: '#e6f7ff',
                              }}
                            >
                              {item.price.toFixed(3)}
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
