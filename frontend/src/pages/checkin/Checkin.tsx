import { useState, useEffect, useMemo } from 'react'
import { Card, Button, Row, Col, Typography, Statistic, message, Spin, Calendar, Badge, Tag } from 'antd'
import { CheckCircleOutlined, FireOutlined, GiftOutlined, TrophyOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import checkinService from '../../services/checkin.service'
import { useTheme } from '../../components/common/ThemeSwitcher'

const { Title, Text, Paragraph } = Typography

const REWARD_DESC = [
  { day: 1, points: 1 },
  { day: 2, points: 2 },
  { day: 3, points: 3 },
  { day: 4, points: 4 },
  { day: 5, points: 5 },
  { day: 6, points: 6 },
  { day: 7, points: 7, label: '满 7 天' },
]

const Checkin = () => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [status, setStatus] = useState<any>(null)
  const [history, setHistory] = useState<any>(null)
  const [calendarDays, setCalendarDays] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(dayjs())

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, h, cal] = await Promise.all([
        checkinService.getStatus(),
        checkinService.getHistory(),
        checkinService.getCalendar(calendarMonth.year(), calendarMonth.month() + 1),
      ])
      setStatus(s)
      setHistory(h)
      const map: Record<string, any> = {}
      ;(cal.days || []).forEach((d: any) => { map[d.date] = d })
      setCalendarDays(map)
    } catch {
      message.error('加载签到数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    checkinService.getCalendar(calendarMonth.year(), calendarMonth.month() + 1)
      .then(cal => {
        const map: Record<string, any> = {}
        ;(cal.days || []).forEach((d: any) => { map[d.date] = d })
        setCalendarDays(map)
      }).catch(() => {})
  }, [calendarMonth])

  const handleCheckin = async () => {
    setSubmitting(true)
    try {
      const res = await checkinService.checkin()
      message.success(res.message)
      if (res.monthBonus) {
        message.success(`恭喜，本月全勤额外奖励 ${res.monthBonus.bonus} 积分！`)
      }
      loadData()
    } catch {
      // 错误由拦截器处理
    } finally {
      setSubmitting(false)
    }
  }

  const cardBg = isDark ? '#1f1f1f' : '#fff'
  const cardBorder = isDark ? '#303030' : '#f0f0f0'
  const textColor = isDark ? '#e0e0e0' : '#1a1a2e'

  const dateCellRender = (date: dayjs.Dayjs) => {
    const key = date.format('YYYY-MM-DD')
    const day = calendarDays[key]
    if (!day) return null
    return (
      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <Badge count={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />} offset={[14, -2]}>
          <Tag color="orange" style={{ borderRadius: 12, margin: 0 }}>+{day.points_earned}</Tag>
        </Badge>
        {day.consecutive_days >= 7 && (
          <div style={{ fontSize: 10, color: '#fa541c', marginTop: 2 }}>
            <FireOutlined /> {day.consecutive_days}天
          </div>
        )}
      </div>
    )
  }

  const streakToNextReward = useMemo(() => {
    const cur = status?.currentStreak || 0
    if (cur >= 7) return { next: 7 - (cur % 7), reward: 7 }
    return { next: 7 - cur, reward: cur + 1 }
  }, [status])

  return (
    <Spin spinning={loading}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Title level={2} style={{ color: textColor }}>
          <CalendarOutlined style={{ marginRight: 8, color: '#fa541c' }} />
          每日签到
        </Title>
        <Paragraph type="secondary">
          每天签到获取积分奖励，连续签到积分翻倍，月度全勤最高 +100 积分
        </Paragraph>

        <Row gutter={[16, 16]}>
          {/* 签到主卡片 */}
          <Col xs={24} md={10}>
            <Card
              style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12 }}
              styles={{ body: { padding: 24, textAlign: 'center' } }}
            >
              <div style={{
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto 16px',
                background: status?.checkedInToday
                  ? 'linear-gradient(135deg, #10b981, #34d399)'
                  : 'linear-gradient(135deg, #fa541c, #fa8c16)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
              }}>
                {status?.checkedInToday ? (
                  <CheckCircleOutlined style={{ fontSize: 56 }} />
                ) : (
                  <FireOutlined style={{ fontSize: 56 }} />
                )}
              </div>
              <Title level={3} style={{ color: textColor, marginBottom: 4 }}>
                {status?.checkedInToday ? '今日已签到' : '今日尚未签到'}
              </Title>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">连续签到</Text>{' '}
                <Text strong style={{ fontSize: 24, color: '#fa541c' }}>
                  {status?.currentStreak ?? 0}
                </Text>{' '}
                <Text type="secondary">天</Text>
              </div>
              <Button
                type="primary"
                size="large"
                block
                disabled={status?.checkedInToday}
                loading={submitting}
                onClick={handleCheckin}
                icon={<FireOutlined />}
                style={{
                  background: status?.checkedInToday
                    ? '#52c41a'
                    : 'linear-gradient(135deg, #fa541c, #fa8c16)',
                  border: 'none',
                  height: 44,
                  borderRadius: 10,
                }}
              >
                {status?.checkedInToday ? '已签到' : '立即签到'}
              </Button>
              {!status?.checkedInToday && (
                <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
                  再签到可获得 <Text strong>{streakToNextReward.reward}</Text> 积分
                </Paragraph>
              )}
            </Card>
          </Col>

          {/* 历史统计 */}
          <Col xs={24} md={14}>
            <Card
              style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12, height: '100%' }}
              title={<><TrophyOutlined style={{ color: '#fa541c' }} /> 签到成就</>}
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic title="累计签到" value={history?.summary.totalDays || 0} suffix="天" />
                </Col>
                <Col span={8}>
                  <Statistic title="最长连续" value={history?.summary.maxStreak || 0} suffix="天" />
                </Col>
                <Col span={8}>
                  <Statistic title="累计积分" value={history?.summary.totalPoints || 0} prefix={<GiftOutlined />} />
                </Col>
              </Row>

              <div style={{ marginTop: 24 }}>
                <Text strong style={{ color: textColor }}>7 天奖励阶梯</Text>
                <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                  {REWARD_DESC.map(d => {
                    const reached = (status?.currentStreak || 0) >= d.day
                    return (
                      <Col span={Math.floor(24 / REWARD_DESC.length)} key={d.day}>
                        <div style={{
                          textAlign: 'center',
                          padding: '12px 4px',
                          borderRadius: 8,
                          background: reached
                            ? (isDark ? 'rgba(250,133,22,0.15)' : 'rgba(250,133,22,0.08)')
                            : (isDark ? '#2a2a2a' : '#f5f5f5'),
                          border: `1px solid ${reached ? '#fa8c16' : 'transparent'}`,
                        }}>
                          <div style={{
                            fontSize: 11,
                            color: reached ? '#fa8c16' : (isDark ? '#888' : '#999'),
                          }}>第 {d.day} 天</div>
                          <div style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: reached ? '#fa8c16' : (isDark ? '#aaa' : '#666'),
                          }}>+{d.points}</div>
                        </div>
                      </Col>
                    )
                  })}
                </Row>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 签到日历 */}
        <Card
          style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12, marginTop: 16 }}
          title={<><CalendarOutlined /> 签到日历</>}
        >
          <Calendar
            value={calendarMonth}
            onPanelChange={(d) => setCalendarMonth(d)}
            cellRender={(current, info) => {
              if (info.type === 'date') return dateCellRender(current)
              return info.originNode
            }}
          />
        </Card>

        {/* 最近签到记录 */}
        {history?.records?.length > 0 && (
          <Card
            style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12, marginTop: 16 }}
            title="最近签到"
          >
            <Row gutter={[8, 8]}>
              {history.records.slice(0, 14).map((r: any, i: number) => (
                <Col xs={12} sm={8} md={6} key={i}>
                  <Card size="small" style={{ background: isDark ? '#2a2a2a' : '#fafafa', borderColor: 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: textColor }}>
                          {dayjs(r.checkin_date).format('MM-DD')}
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          连续 {r.consecutive_days} 天
                        </Text>
                      </div>
                      <Tag color="orange">+{r.points_earned}</Tag>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}
      </div>
    </Spin>
  )
}

export default Checkin
