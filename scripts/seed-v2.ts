// Seed script: 2 problems per knowledge point, 10 test cases each
// Usage: cd ai-onlinejudge && npx tsx backend/node_modules/.bin/tsx scripts/seed-v2.ts
//   or: cd backend && npx tsx -r dotenv/config ../scripts/seed-v2.ts

import { query } from '../backend/src/config/database'

interface TestCase { input: string; output: string; is_sample: boolean }
interface ProblemDef {
  title: string
  desc: string
  difficulty: 'easy' | 'medium' | 'hard'
  categories: string[]
  time_limit: number
  memory_limit: number
  gen: () => TestCase[]
}

const randInt = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo
const randArr = (n: number, lo: number, hi: number) => Array.from({length: n}, () => randInt(lo, hi))

const problems: ProblemDef[] = [
// ======================== 语法基础 ========================

// --- io ---
{
  title: 'A+B Problem',
  desc: `## 题目描述

给定两个整数 $A$ 和 $B$，输出 $A+B$ 的值。

## 输入格式

一行，包含两个整数 $A$ 和 $B$，以空格分隔。

## 输出格式

一行，一个整数，表示 $A+B$ 的值。

## 数据范围

$-10^9 \\le A, B \\le 10^9$`,
  difficulty: 'easy', categories: ['io'], time_limit: 1000, memory_limit: 256,
  gen: () => [
    {input:'1 2',output:'3',is_sample:true},
    {input:'10 -5',output:'5',is_sample:true},
    ...Array.from({length:8},()=>{const a=randInt(-1e6,1e6),b=randInt(-1e6,1e6);return{input:`${a} ${b}`,output:`${a+b}`,is_sample:false}})
  ]
},
{
  title: '格式化输出',
  desc: `## 题目描述

给定一个浮点数 $N$ 和一个整数 $M$，输出 $N$ 保留 $M$ 位小数的结果。

## 输入格式

第一行一个浮点数 $N$。第二行一个整数 $M$（$1 \\le M \\le 5$）。

## 输出格式

一行，$N$ 保留 $M$ 位小数（四舍五入）。

## 数据范围

$-1000 \\le N \\le 1000$`,
  difficulty: 'easy', categories: ['io'], time_limit: 1000, memory_limit: 256,
  gen: () => [
    {input:'3.14159\n2',output:'3.14',is_sample:true},
    {input:'2.71828\n4',output:'2.7183',is_sample:true},
    ...[ [1.23456,3],[-0.5678,2],[99.9999,2],[0.00001,5],[100.5,1],[-3.145,3],[50.005,2],[7.77777,4] ].map(([n,m]:any)=>({input:`${n}\n${m}`,output:n.toFixed(m),is_sample:false}))
  ]
},

// --- variables ---
{
  title: '温度转换',
  desc: `## 题目描述

给定一个华氏温度 $F$，请将其转换为摄氏温度 $C$。

转换公式：$C = \\frac{5}{9}(F - 32)$，结果保留两位小数。

## 输入格式

一行，一个浮点数 $F$。

## 输出格式

一行，转换后的摄氏温度，保留两位小数。

## 数据范围

$-100 \\le F \\le 200$`,
  difficulty: 'easy', categories: ['variables'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const conv = (f:number) => ((5/9)*(f-32)).toFixed(2)
    return [
      {input:'100',output:conv(100),is_sample:true},
      {input:'32',output:'0.00',is_sample:true},
      ...[0,50,-40,212,75,98.6,37,-17.78].map(f=>({input:`${f}`,output:conv(f),is_sample:false}))
    ]
  }
},
{
  title: '三角形面积',
  desc: `## 题目描述

给定三角形的三条边长 $a, b, c$，使用海伦公式计算三角形面积，保留两位小数。

海伦公式：$S = \\sqrt{p(p-a)(p-b)(p-c)}$，其中 $p = \\frac{a+b+c}{2}$。

保证输入的三条边能构成合法三角形。

## 输入格式

一行，三个浮点数 $a, b, c$，以空格分隔。

## 输出格式

一行，三角形面积，保留两位小数。

## 数据范围

$0 < a, b, c \\le 1000$`,
  difficulty: 'easy', categories: ['variables'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const area = (a:number,b:number,c:number)=>{const p=(a+b+c)/2;return Math.sqrt(p*(p-a)*(p-b)*(p-c)).toFixed(2)}
    return [
      {input:'3 4 5',output:area(3,4,5),is_sample:true},
      {input:'5 5 5',output:area(5,5,5),is_sample:true},
      ...[[3,4,5],[7,8,9],[10,10,10],[5,12,13],[6,8,10],[8,15,17],[9,10,11],[20,21,22]].map(([a,b,c])=>({input:`${a} ${b} ${c}`,output:area(a,b,c),is_sample:false}))
    ]
  }
},

// --- control ---
{
  title: '奇偶判断',
  desc: `## 题目描述

给定一个整数 $N$，判断它是奇数还是偶数。

## 输入格式

一行，一个整数 $N$。

## 输出格式

如果是奇数输出 \`odd\`，偶数输出 \`even\`。

## 数据范围

$-10^9 \\le N \\le 10^9$`,
  difficulty: 'easy', categories: ['control'], time_limit: 1000, memory_limit: 256,
  gen: () => [
    {input:'3',output:'odd',is_sample:true},{input:'4',output:'even',is_sample:true},
    ...[0,1,-1,100,999,-100,2,7].map(n=>({input:`${n}`,output:n%2===0?'even':'odd',is_sample:false}))
  ]
},
{
  title: '闰年判断',
  desc: `## 题目描述

给定一个年份 $Y$，判断是否为闰年。

闰年规则：
- 能被 4 整除但不能被 100 整除的是闰年
- 能被 400 整除的也是闰年

## 输入格式

一行，一个整数 $Y$。

## 输出格式

是闰年输出 \`Yes\`，否则输出 \`No\`。

## 数据范围

$1 \\le Y \\le 9999$`,
  difficulty: 'easy', categories: ['control'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const lp = (y:number) => (y%4===0&&y%100!==0)||y%400===0?'Yes':'No'
    return [
      {input:'2000',output:'Yes',is_sample:true},{input:'1900',output:'No',is_sample:true},
      ...[2024,2023,2000,1900,1996,2100,2400,100].map(y=>({input:`${y}`,output:lp(y),is_sample:false}))
    ]
  }
},

// --- loops ---
{
  title: '求和',
  desc: `## 题目描述

给定一个正整数 $N$，求 $1+2+3+\\cdots+N$ 的值。

## 输入格式

一行，一个正整数 $N$。

## 输出格式

一行，一个整数，表示求和结果。

## 数据范围

$1 \\le N \\le 10^9$`,
  difficulty: 'easy', categories: ['loops'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const sum = (n:number) => BigInt(n)*(BigInt(n)+1n)/2n
    return [
      {input:'5',output:'15',is_sample:true},{input:'100',output:'5050',is_sample:true},
      ...[1,10,1000,999999999,1e9,42,100000,500000000].map(n=>({input:`${n}`,output:`${sum(n)}`,is_sample:false}))
    ]
  }
},
{
  title: '阶乘末尾零',
  desc: `## 题目描述

给定一个正整数 $N$，求 $N!$ 末尾有多少个连续的零。

## 输入格式

一行，一个正整数 $N$。

## 输出格式

一行，一个整数，表示末尾零的个数。

## 数据范围

$1 \\le N \\le 10^9$`,
  difficulty: 'easy', categories: ['loops'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const zeros = (n:number) => { let c=0; for(let i=5;i<=n;i*=5) c+=Math.floor(n/i); return c }
    return [
      {input:'5',output:'1',is_sample:true},{input:'10',output:'2',is_sample:true},
      ...[1,3,25,100,1000,50,125,1000000000].map(n=>({input:`${n}`,output:`${zeros(n)}`,is_sample:false}))
    ]
  }
},

// --- arrays ---
{
  title: '数组最大值',
  desc: `## 题目描述

给定 $N$ 个整数，找出其中的最大值及其出现的位置（从 1 开始计数）。如果有多个最大值，输出第一个的位置。

## 输入格式

第一行一个正整数 $N$。第二行 $N$ 个整数，以空格分隔。

## 输出格式

一行，两个整数，分别为最大值和其位置。

## 数据范围

$1 \\le N \\le 10^5$，$-10^9 \\le a_i \\le 10^9$`,
  difficulty: 'easy', categories: ['arrays'], time_limit: 1000, memory_limit: 256,
  gen: () => [
    {input:'5\n3 1 4 1 5',output:'5 5',is_sample:true},
    {input:'3\n-1 -2 -3',output:'-1 1',is_sample:true},
    ...Array.from({length:8},()=>{
      const n=randInt(5,20),arr=randArr(n,-100,100)
      const max=Math.max(...arr),pos=arr.indexOf(max)+1
      return{input:`${n}\n${arr.join(' ')}`,output:`${max} ${pos}`,is_sample:false}
    })
  ]
},
{
  title: '数组翻转',
  desc: `## 题目描述

给定 $N$ 个整数，将其翻转后输出。

## 输入格式

第一行一个正整数 $N$。第二行 $N$ 个整数，以空格分隔。

## 输出格式

一行，翻转后的 $N$ 个整数，以空格分隔。

## 数据范围

$1 \\le N \\le 10^5$`,
  difficulty: 'easy', categories: ['arrays'], time_limit: 1000, memory_limit: 256,
  gen: () => [
    {input:'5\n1 2 3 4 5',output:'5 4 3 2 1',is_sample:true},
    {input:'3\n10 20 30',output:'30 20 10',is_sample:true},
    ...Array.from({length:8},()=>{
      const n=randInt(5,15),arr=randArr(n,1,100)
      return{input:`${n}\n${arr.join(' ')}`,output:arr.slice().reverse().join(' '),is_sample:false}
    })
  ]
},

// --- strings ---
{
  title: '回文判断',
  desc: `## 题目描述

给定一个字符串，判断它是否为回文串（正读和反读相同）。

## 输入格式

一行，一个字符串（只含小写字母）。

## 输出格式

是回文输出 \`Yes\`，否则输出 \`No\`。

## 数据范围

字符串长度 $1 \\le |s| \\le 1000$`,
  difficulty: 'easy', categories: ['strings'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const pal = (s:string) => s===s.split('').reverse().join('')?'Yes':'No'
    return [
      {input:'aba',output:'Yes',is_sample:true},{input:'abc',output:'No',is_sample:true},
    ...['a','aa','abba','hello','racecar','abcba','xyz','abccba','code'].map(s=>({input:s,output:pal(s),is_sample:false}))
    ]
  }
},
{
  title: '字符统计',
  desc: `## 题目描述

给定一个字符串，统计其中数字字符的个数。

## 输入格式

一行，一个字符串（可能包含空格）。

## 输出格式

一行，一个整数，表示数字字符的个数。

## 数据范围

字符串长度 $1 \\le |s| \\le 1000$`,
  difficulty: 'easy', categories: ['strings'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const cnt = (s:string) => s.split('').filter(c=>c>='0'&&c<='9').length
    return [
      {input:'abc123',output:'3',is_sample:true},{input:'hello world',output:'0',is_sample:true},
    ...['a1b2c3','','test 007','2024year','no digits here','x1y2z3w4','12345','age=18'].map(s=>({input:s,output:`${cnt(s)}`,is_sample:false}))
    ]
  }
},

// --- functions ---
{
  title: '最大公约数',
  desc: `## 题目描述

给定两个正整数 $A$ 和 $B$，求它们的最大公约数（GCD）。

## 输入格式

一行，两个正整数 $A$ 和 $B$。

## 输出格式

一行，一个整数，表示 GCD。

## 数据范围

$1 \\le A, B \\le 10^9$`,
  difficulty: 'easy', categories: ['functions'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gcd=(a:number,b:number):number=>b===0?a:gcd(b,a%b)
    return [
      {input:'12 18',output:'6',is_sample:true},{input:'7 13',output:'1',is_sample:true},
    ...[[100,75],[48,36],[17,23],[256,192],[81,54],[999,333],[1000,1],[35,49]].map(([a,b])=>({input:`${a} ${b}`,output:`${gcd(a,b)}`,is_sample:false}))
    ]
  }
},
{
  title: '素数判断',
  desc: `## 题目描述

给定一个正整数 $N$，判断它是否为素数。

## 输入格式

一行，一个正整数 $N$。

## 输出格式

是素数输出 \`Yes\`，否则输出 \`No\`。

## 数据范围

$1 \\le N \\le 10^{12}$`,
  difficulty: 'easy', categories: ['functions'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const isPrime=(n:number)=>{if(n<2)return false;if(n<4)return true;if(n%2===0||n%3===0)return false;for(let i=5;i*i<=n;i+=6)if(n%i===0||n%(i+2)===0)return false;return true}
    const p=(n:number)=>isPrime(n)?'Yes':'No'
    return [
      {input:'7',output:'Yes',is_sample:true},{input:'4',output:'No',is_sample:true},
    ...[1,2,3,10,97,100,999983,1000000007].map(n=>({input:`${n}`,output:p(n),is_sample:false}))
    ]
  }
},

// --- structures ---
{
  title: '学生成绩排序',
  desc: `## 题目描述

有 $N$ 个学生，每个学生有姓名和成绩。请按成绩从高到低排序后输出。成绩相同时按输入顺序输出。

## 输入格式

第一行一个正整数 $N$。接下来 $N$ 行，每行一个字符串（姓名）和一个整数（成绩）。

## 输出格式

$N$ 行，每行姓名和成绩，以空格分隔。

## 数据范围

$1 \\le N \\le 100$，成绩 $0 \\le s \\le 100$`,
  difficulty: 'easy', categories: ['structures'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const genOne=()=>{
      const n=randInt(3,6);const stu=Array.from({length:n},(_,i)=>({name:String.fromCharCode(65+i),score:randInt(50,100)}))
      const sorted=stu.map((s,i)=>({...s,idx:i})).sort((a,b)=>b.score-a.score||a.idx-b.idx)
      return{input:`${n}\n${stu.map(s=>`${s.name} ${s.score}`).join('\n')}`,output:sorted.map(s=>`${s.name} ${s.score}`).join('\n'),is_sample:false}
    }
    return [
      {input:'3\nAlice 90\nBob 85\nCarol 95',output:'Carol 95\nAlice 90\nBob 85',is_sample:true},
      {input:'2\nX 100\nY 100',output:'X 100\nY 100',is_sample:true},
      ...Array.from({length:8},genOne)
    ]
  }
},
{
  title: '两点距离',
  desc: `## 题目描述

给定平面上两个点 $(x_1, y_1)$ 和 $(x_2, y_2)$，求它们之间的欧几里得距离，保留两位小数。

## 输入格式

一行，四个浮点数 $x_1, y_1, x_2, y_2$。

## 输出格式

一行，距离值，保留两位小数。

## 数据范围

$-1000 \\le x, y \\le 1000$`,
  difficulty: 'easy', categories: ['structures'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const dist=(x1:number,y1:number,x2:number,y2:number)=>Math.sqrt((x2-x1)**2+(y2-y1)**2).toFixed(2)
    return [
      {input:'0 0 3 4',output:'5.00',is_sample:true},{input:'1 1 2 2',output:dist(1,1,2,2),is_sample:true},
    ...[[0,0,0,0],[0,0,1,0],[-1,-1,2,2],[0,0,100,0],[3.5,2.1,7.8,4.9]].map(([x1,y1,x2,y2])=>({input:`${x1} ${y1} ${x2} ${y2}`,output:dist(x1,y1,x2,y2 as number),is_sample:false}))
    ]
  }
},

// ======================== 算法基础 ========================

// --- simulation ---
{
  title: '日期推算',
  desc: `## 题目描述

给定一个日期（年月日）和天数 $N$，求 $N$ 天后的日期。

## 输入格式

第一行三个整数 $Y, M, D$，表示日期。第二行一个正整数 $N$。

## 输出格式

一行三个整数，表示 $N$ 天后的日期，格式为 \`YYYY MM DD\`。

## 数据范围

$2000 \\le Y \\le 2100$，$1 \\le N \\le 1000$，输入日期合法。`,
  difficulty: 'medium', categories: ['simulation'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const add=(y:number,m:number,d:number,n:number)=>{const dt=new Date(y,m-1,d);dt.setDate(dt.getDate()+n);return`${dt.getFullYear()} ${dt.getMonth()+1} ${dt.getDate()}`}
    return [
      {input:'2024 1 1\n1',output:'2024 1 2',is_sample:true},{input:'2024 12 31\n1',output:'2025 1 1',is_sample:true},
    ...[[2024,3,1,10],[2024,2,28,1],[2023,12,25,7],[2024,1,15,30],[2020,2,28,1],[2024,6,15,100],[2000,1,1,365],[2024,7,1,50]].map(([y,m,d,n])=>({input:`${y} ${m} ${d}\n${n}`,output:add(y,m,d,n),is_sample:false}))
    ]
  }
},
{
  title: '机器人行走',
  desc: `## 题目描述

一个机器人在二维平面上从原点 $(0,0)$ 出发，收到一串指令。指令包含 \`U\`（上）、\`D\`（下）、\`L\`（左）、\`R\`（右），每次移动一格。求最终位置。

## 输入格式

一行，一个由 \`UDLR\` 组成的字符串。

## 输出格式

一行，两个整数，表示最终坐标。

## 数据范围

指令长度 $1 \\le |s| \\le 10^5$`,
  difficulty: 'easy', categories: ['simulation'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const walk=(s:string)=>{let x=0,y=0;for(const c of s){if(c==='U')y++;if(c==='D')y--;if(c==='R')x++;if(c==='L')x--}return`${x} ${y}`}
    return [
      {input:'UUURDDL',output:'1 1',is_sample:true},{input:'LR',output:'0 0',is_sample:true},
    ...['UUUU','DDDD','LLLL','RRRR','URDL','UUUDDD','LRLR','UUURRDDLL'].map(s=>({input:s,output:walk(s),is_sample:false}))
    ]
  }
},

// --- enumeration ---
{
  title: '鸡兔同笼',
  desc: `## 题目描述

笼中有若干只鸡和兔，已知头的总数 $H$ 和脚的总数 $F$。求鸡和兔各有多少只。若无解输出 \`No answer\`。

## 输入格式

一行，两个正整数 $H$ 和 $F$。

## 输出格式

一行，两个整数，分别为鸡和兔的数量。若无解输出 \`No answer\`。

## 数据范围

$1 \\le H \\le 1000$，$1 \\le F \\le 4000$`,
  difficulty: 'easy', categories: ['enumeration'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const solve=(h:number,f:number)=>{for(let r=0;r<=h;r++){const c=h-r;if(2*c+4*r===f)return`${c} ${r}`}return'No answer'}
    return [
      {input:'10 28',output:'6 4',is_sample:true},{input:'2 6',output:'1 1',is_sample:true},
    ...[[35,94],[10,40],[3,10],[5,12],[100,200],[10,30],[1,3],[10,31]].map(([h,f])=>({input:`${h} ${f}`,output:solve(h,f),is_sample:false}))
    ]
  }
},
{
  title: '完全平方数',
  desc: `## 题目描述

给定两个正整数 $L$ 和 $R$，求区间 $[L, R]$ 内有多少个完全平方数。

## 输入格式

一行，两个正整数 $L$ 和 $R$。

## 输出格式

一行，一个整数，表示完全平方数的个数。

## 数据范围

$1 \\le L \\le R \\le 10^9$`,
  difficulty: 'easy', categories: ['enumeration'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const cnt=(l:number,r:number)=>Math.floor(Math.sqrt(r))-Math.ceil(Math.sqrt(l))+1
    return [
      {input:'1 10',output:'3',is_sample:true},{input:'4 16',output:'3',is_sample:true},
    ...[[1,1],[1,100],[100,200],[25,36],[1,1000000000],[50,60],[1,4],[10,20]].map(([l,r])=>({input:`${l} ${r}`,output:`${cnt(l,r)}`,is_sample:false}))
    ]
  }
},

// --- sorting ---
{
  title: '排序',
  desc: `## 题目描述

给定 $N$ 个整数，将其从小到大排序后输出。

## 输入格式

第一行一个正整数 $N$。第二行 $N$ 个整数。

## 输出格式

一行，排序后的 $N$ 个整数，以空格分隔。

## 数据范围

$1 \\le N \\le 10^5$`,
  difficulty: 'easy', categories: ['sorting'], time_limit: 1000, memory_limit: 256,
  gen: () => [
    {input:'5\n5 3 1 4 2',output:'1 2 3 4 5',is_sample:true},
    {input:'3\n-1 -3 -2',output:'-3 -2 -1',is_sample:true},
    ...Array.from({length:8},()=>{
      const n=randInt(5,20),arr=randArr(n,-50,50).sort((a,b)=>a-b)
      return{input:`${n}\n${randArr(n,-50,50).join(' ')}`,output:randArr(n,-50,50).sort((a,b)=>a-b).join(' '),is_sample:false}
    })
  ]
},
{
  title: '第 K 小的数',
  desc: `## 题目描述

给定 $N$ 个整数和一个正整数 $K$，求第 $K$ 小的数。

## 输入格式

第一行两个正整数 $N$ 和 $K$。第二行 $N$ 个整数。

## 输出格式

一行，一个整数，表示第 $K$ 小的数。

## 数据范围

$1 \\le K \\le N \\le 10^5$`,
  difficulty: 'easy', categories: ['sorting'], time_limit: 1000, memory_limit: 256,
  gen: () => [
    {input:'5 3\n5 3 1 4 2',output:'3',is_sample:true},
    {input:'4 1\n4 3 2 1',output:'1',is_sample:true},
    ...Array.from({length:8},()=>{
      const n=randInt(5,15),k=randInt(1,n),raw=randArr(n,-50,50)
      return{input:`${n} ${k}\n${raw.join(' ')}`,output:`${raw.sort((a,b)=>a-b)[k-1]}`,is_sample:false}
    })
  ]
},

// --- binary_search ---
{
  title: '查找',
  desc: `## 题目描述

给定一个**已排序**的 $N$ 个整数序列和 $Q$ 个查询，对每个查询输出该数是否在序列中存在。

## 输入格式

第一行一个正整数 $N$。第二行 $N$ 个已排序的整数。第三行一个正整数 $Q$。接下来 $Q$ 行，每行一个待查整数。

## 输出格式

$Q$ 行，存在输出 \`Yes\`，否则输出 \`No\`。

## 数据范围

$1 \\le N, Q \\le 10^5$`,
  difficulty: 'medium', categories: ['binary_search'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{
      const n=randInt(5,15),arr=[...new Set(randArr(n,-20,20))].sort((a,b)=>a-b)
      const q=randInt(3,5),qs=Array.from({length:q},()=>randInt(-20,20))
      return{input:`${arr.length}\n${arr.join(' ')}\n${q}\n${qs.join('\n')}`,output:qs.map(x=>arr.includes(x)?'Yes':'No').join('\n'),is_sample:false}
    }
    return [
      {input:'5\n1 3 5 7 9\n3\n3\n4\n5',output:'Yes\nNo\nYes',is_sample:true},
      {input:'3\n1 2 3\n2\n1\n4',output:'Yes\nNo',is_sample:true},
      ...Array.from({length:8},gen1)
    ]
  }
},
{
  title: '二分求平方根',
  desc: `## 题目描述

给定一个非负整数 $N$，求 $\\lfloor\\sqrt{N}\\rfloor$。要求使用二分查找。

## 输入格式

一行，一个非负整数 $N$。

## 输出格式

一行，一个整数。

## 数据范围

$0 \\le N \\le 10^{18}$`,
  difficulty: 'medium', categories: ['binary_search'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const isqrt=(n:number)=>{if(n<0)return -1;let lo=0n,hi=BigInt(n)+1n;while(lo<hi){const mid=(lo+hi)/2n;if(mid*mid<=BigInt(n))lo=mid+1n;else hi=mid}return Number(lo-1n)}
    return [
      {input:'4',output:'2',is_sample:true},{input:'8',output:'2',is_sample:true},
    ...[0,1,2,9,10,15,16,100,999999999999999999n].map(n=>({input:`${n}`,output:`${isqrt(Number(n))}`,is_sample:false}))
    ]
  }
},

// --- greedy ---
{
  title: '找零钱',
  desc: `## 题目描述

有 $1, 5, 10, 20, 50, 100$ 元面值的纸币，每种面值数量无限。给定金额 $N$，求最少需要多少张纸币。

## 输入格式

一行，一个正整数 $N$。

## 输出格式

一行，最少纸币张数。

## 数据范围

$1 \\le N \\le 10^6$`,
  difficulty: 'easy', categories: ['greedy'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const change=(n:number)=>{let c=0;const v=[100,50,20,10,5,1];for(const x of v){c+=Math.floor(n/x);n%=x}return c}
    return [
      {input:'125',output:'3',is_sample:true},{input:'6',output:'2',is_sample:true},
    ...[1,5,10,99,100,250,500,999].map(n=>({input:`${n}`,output:`${change(n)}`,is_sample:false}))
    ]
  }
},
{
  title: '活动选择',
  desc: `## 题目描述

有 $N$ 个活动，每个活动有一个开始时间和结束时间。求最多能参加多少个不重叠的活动。

## 输入格式

第一行一个正整数 $N$。接下来 $N$ 行，每行两个正整数 $s_i, e_i$，表示开始和结束时间。

## 输出格式

一行，最多活动数。

## 数据范围

$1 \\le N \\le 10^5$，$1 \\le s_i < e_i \\le 10^6$`,
  difficulty: 'medium', categories: ['greedy'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const solve=(acts:number[][])=>{acts.sort((a,b)=>a[1]-b[1]);let c=0,last=0;for(const[s,e]of acts)if(s>=last){c++;last=e}return c}
    const gen1=()=>{
      const n=randInt(4,10),acts=Array.from({length:n},()=>{const s=randInt(1,20),e=s+randInt(1,5);return[s,e]})
      return{input:`${n}\n${acts.map(a=>a.join(' ')).join('\n')}`,output:`${solve(acts)}`,is_sample:false}
    }
    return [
      {input:'4\n1 3\n2 5\n3 6\n5 7',output:'3',is_sample:true},
    ...Array.from({length:9},gen1)
    ]
  }
},

// --- recursion ---
{
  title: '斐波那契数列',
  desc: `## 题目描述

求斐波那契数列的第 $N$ 项。$F(1)=1, F(2)=1, F(n)=F(n-1)+F(n-2)$。结果对 $10^9+7$ 取模。

## 输入格式

一行，一个正整数 $N$。

## 输出格式

一行，$F(N) \\mod 10^9+7$。

## 数据范围

$1 \\le N \\le 10^6$`,
  difficulty: 'easy', categories: ['recursion'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const MOD=1e9+7;const fib=(n:number)=>{let a=1,b=1;for(let i=3;i<=n;i++){const t=(a+b)%MOD;a=b;b=t}return n<=2?1:b}
    return [
      {input:'1',output:'1',is_sample:true},{input:'10',output:'55',is_sample:true},
    ...[2,5,20,50,100,1000,100000,1000000].map(n=>({input:`${n}`,output:`${fib(n)}`,is_sample:false}))
    ]
  }
},
{
  title: '汉诺塔步数',
  desc: `## 题目描述

三柱汉诺塔，$N$ 个盘子从 A 移到 C，求最少移动步数。

## 输入格式

一行，一个正整数 $N$。

## 输出格式

一行，最少步数。

## 数据范围

$1 \\le N \\le 30$`,
  difficulty: 'easy', categories: ['recursion'], time_limit: 1000, memory_limit: 256,
  gen: () => [
    {input:'1',output:'1',is_sample:true},{input:'3',output:'7',is_sample:true},
    ...[2,4,5,10,15,20,25,30].map(n=>({input:`${n}`,output:`${(1<<n)-1}`,is_sample:false}))
  ]
},

// --- divide_conquer ---
{
  title: '逆序对计数',
  desc: `## 题目描述

给定一个长度为 $N$ 的数组，求逆序对的数量（即满足 $i < j$ 且 $a_i > a_j$ 的数对个数）。

## 输入格式

第一行一个正整数 $N$。第二行 $N$ 个整数。

## 输出格式

一行，逆序对数量。

## 数据范围

$1 \\le N \\le 10^5$`,
  difficulty: 'medium', categories: ['divide_conquer'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const mergeCount=(arr:number[])=>{let c=0;const ms=(a:number[]):number[]=>{if(a.length<=1)return a;const m=a.length>>1;const l=ms(a.slice(0,m)),r=ms(a.slice(m));let i=0,j=0;const res:number[]=[];while(i<l.length&&j<r.length){if(l[i]<=r[j])res.push(l[i++]);else{res.push(r[j++]);c+=l.length-i}}return res.concat(l.slice(i),r.slice(j))};ms(arr);return c}
    return [
      {input:'5\n5 3 2 4 1',output:`${mergeCount([5,3,2,4,1])}`,is_sample:true},
      {input:'3\n1 2 3',output:'0',is_sample:true},
    ...Array.from({length:8},()=>{
      const n=randInt(5,15),arr=randArr(n,1,100)
      return{input:`${n}\n${arr.join(' ')}`,output:`${mergeCount([...arr])}`,is_sample:false}
    })
    ]
  }
},
{
  title: '快速幂',
  desc: `## 题目描述

给定 $a, b, p$，求 $a^b \\mod p$。

## 输入格式

一行，三个整数 $a, b, p$。

## 输出格式

一行，$a^b \\mod p$ 的值。

## 数据范围

$0 \\le a, b \\le 10^9$，$1 \\le p \\le 10^9$`,
  difficulty: 'medium', categories: ['divide_conquer'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const qpow=(a:number,b:number,p:number)=>{a=((a%p)+p)%p;let r=1;while(b>0){if(b&1)r=Number(BigInt(r)*BigInt(a)%BigInt(p));a=Number(BigInt(a)*BigInt(a)%BigInt(p));b>>=1}return r}
    return [
      {input:'2 10 1000',output:'24',is_sample:true},{input:'3 0 7',output:'1',is_sample:true},
    ...[[2,10,1000000007],[5,13,1000000007],[10,9,17],[2,1000000000,1000000007],[7,1,100],[0,5,3],[100,100,997],[1,1000000000,2]].map(([a,b,p])=>({input:`${a} ${b} ${p}`,output:`${qpow(a,b,p)}`,is_sample:false}))
    ]
  }
},

// --- dfs ---
{
  title: '全排列',
  desc: `## 题目描述

给定一个正整数 $N$，输出 $1$ 到 $N$ 的所有全排列，按字典序输出。

## 输入格式

一行，一个正整数 $N$。

## 输出格式

每行一个排列，数字之间用空格分隔。

## 数据范围

$1 \\le N \\le 8$`,
  difficulty: 'easy', categories: ['dfs'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const perms=(n:number)=>{const res:number[][]=[];const used=new Set<number>();const dfs=(cur:number[])=>{if(cur.length===n){res.push([...cur]);return}for(let i=1;i<=n;i++){if(used.has(i))continue;used.add(i);cur.push(i);dfs(cur);cur.pop();used.delete(i)}};dfs([]);return res.map(r=>r.join(' ')).join('\n')}
    return [
      {input:'3',output:'1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1',is_sample:true},
      {input:'1',output:'1',is_sample:true},
    ...[2,4,5,3,2,4,3,5].map(n=>({input:`${n}`,output:perms(n),is_sample:false}))
    ]
  }
},
{
  title: '迷宫路径',
  desc: `## 题目描述

给定一个 $N \\times N$ 的迷宫，\`.\` 为可通行，\`#\` 为墙壁。求从左上角 $(0,0)$ 到右下角 $(N-1,N-1)$ 的最短路径步数。若不可达输出 \`-1\`。

## 输入格式

第一行一个正整数 $N$。接下来 $N$ 行，每行一个长度为 $N$ 的字符串。

## 输出格式

一行，最短步数或 \`-1\`。

## 数据范围

$2 \\le N \\le 100$`,
  difficulty: 'medium', categories: ['dfs','bfs'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const bfs=(grid:string[])=>{const n=grid.length;const q:[[number,number]]=[[0,0]];const dist=Array.from({length:n},()=>Array(n).fill(-1));dist[0][0]=0;const dx=[0,0,1,-1],dy=[1,-1,0,0];let h=0;while(h<q.length){const[x,y]=q[h++];for(let d=0;d<4;d++){const nx=x+dx[d],ny=y+dy[d];if(nx>=0&&nx<n&&ny>=0&&ny<n&&grid[nx][ny]==='.'&&dist[nx][ny]===-1){dist[nx][ny]=dist[x][y]+1;q.push([nx,ny])}}}return dist[n-1][n-1]}
    const gen1=()=>{
      const n=randInt(4,8);const g=Array.from({length:n},()=>Array.from({length:n},()=>Math.random()>0.25?'.':'#'));g[0][0]='.';g[n-1][n-1]='.'
      const grid=g.map(r=>r.join(''));return{input:`${n}\n${grid.join('\n')}`,output:`${bfs(grid)}`,is_sample:false}
    }
    return [
      {input:'3\n...\n.#.\n...',output:'4',is_sample:true},{input:'2\n.#\n#.',output:'-1',is_sample:true},
    ...Array.from({length:8},gen1)
    ]
  }
},

// --- bfs ---
{
  title: '走迷宫步数',
  desc: `## 题目描述

在 $N \\times M$ 的网格中，\`0\` 表示可通行，\`1\` 表示障碍。从 $(0,0)$ 走到 $(N-1,M-1)$，每次可向四个方向移动一格，求最少步数。不可达输出 \`-1\`。

## 输入格式

第一行两个正整数 $N, M$。接下来 $N$ 行，每行 $M$ 个整数（0 或 1）。

## 输出格式

一行，最少步数。

## 数据范围

$1 \\le N, M \\le 100$`,
  difficulty: 'medium', categories: ['bfs'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const solve=(grid:number[][])=>{const n=grid.length,m=grid[0].length;const q:[[number,number]]=[[0,0]];const dist=Array.from({length:n},()=>Array(m).fill(-1));dist[0][0]=0;const dx=[0,0,1,-1],dy=[1,-1,0,0];let h=0;while(h<q.length){const[x,y]=q[h++];for(let d=0;d<4;d++){const nx=x+dx[d],ny=y+dy[d];if(nx>=0&&nx<n&&ny>=0&&ny<m&&grid[nx][ny]===0&&dist[nx][ny]===-1){dist[nx][ny]=dist[x][y]+1;q.push([nx,ny])}}}return dist[n-1][m-1]}
    return [
      {input:'3 3\n0 0 0\n0 1 0\n0 0 0',output:'4',is_sample:true},
    ...Array.from({length:9},()=>{
      const n=randInt(3,7),m=randInt(3,7);const g=Array.from({length:n},()=>Array.from({length:m},()=>Math.random()>0.25?0:1));g[0][0]=0;g[n-1][m-1]=0
      return{input:`${n} ${m}\n${g.map(r=>r.join(' ')).join('\n')}`,output:`${solve(g)}`,is_sample:false}
    })
    ]
  }
},
{
  title: '骑士移动',
  desc: `## 题目描述

在国际象棋棋盘上，骑士从 $(0,0)$ 出发，到达 $(x,y)$ 最少需要几步。骑士走"L"形：$(\\pm1,\\pm2)$ 或 $(\\pm2,\\pm1)$。不可达输出 \`-1\`。

## 输入格式

一行，两个整数 $x, y$。

## 输出格式

一行，最少步数。

## 数据范围

$-100 \\le x, y \\le 100$`,
  difficulty: 'medium', categories: ['bfs'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const solve=(tx:number,ty:number)=>{
      const S=300,O=150;const dist=Array.from({length:S},()=>Array(S).fill(-1));dist[O][O]=0
      const q:[[number,number]]=[[O,O]];const dx=[1,2,2,1,-1,-2,-2,-1],dy=[2,1,-1,-2,-2,-1,1,2];let h=0
      while(h<q.length){const[x,y]=q[h++];for(let d=0;d<8;d++){const nx=x+dx[d],ny=y+dy[d];if(nx>=0&&nx<S&&ny>=0&&ny<S&&dist[nx][ny]===-1){dist[nx][ny]=dist[x][y]+1;q.push([nx,ny])}}}
      return dist[tx+O][ty+O]
    }
    return [
      {input:'1 2',output:'1',is_sample:true},{input:'0 0',output:'0',is_sample:true},
    ...[[2,1],[4,5],[3,3],[1,0],[7,0],[10,10],[5,5],[2,2]].map(([x,y])=>({input:`${x} ${y}`,output:`${solve(x,y)}`,is_sample:false}))
    ]
  }
},

// --- dp_basic ---
{
  title: '爬楼梯',
  desc: `## 题目描述

每次可以走 $1$ 阶或 $2$ 阶，走到第 $N$ 阶有多少种不同的走法？结果对 $10^9+7$ 取模。

## 输入格式

一行，一个正整数 $N$。

## 输出格式

一行，走法数量。

## 数据范围

$1 \\le N \\le 10^5$`,
  difficulty: 'easy', categories: ['dp_basic'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const MOD=1e9+7;const solve=(n:number)=>{if(n<=2)return n;let a=1,b=2;for(let i=3;i<=n;i++){const t=(a+b)%MOD;a=b;b=t}return b}
    return [
      {input:'2',output:'2',is_sample:true},{input:'5',output:'8',is_sample:true},
    ...[1,3,4,10,50,100,1000,100000].map(n=>({input:`${n}`,output:`${solve(n)}`,is_sample:false}))
    ]
  }
},
{
  title: '最大子段和',
  desc: `## 题目描述

给定一个长度为 $N$ 的整数数组（含负数），求连续子数组的最大和。

## 输入格式

第一行一个正整数 $N$。第二行 $N$ 个整数。

## 输出格式

一行，最大子段和。

## 数据范围

$1 \\le N \\le 10^5$，$-10^4 \\le a_i \\le 10^4$`,
  difficulty: 'easy', categories: ['dp_basic'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const kadane=(a:number[])=>{let mx=a[0],cur=a[0];for(let i=1;i<a.length;i++){cur=Math.max(a[i],cur+a[i]);mx=Math.max(mx,cur)}return mx}
    return [
      {input:'5\n-2 1 -3 4 -1',output:'4',is_sample:true},{input:'3\n-1 -2 -3',output:'-1',is_sample:true},
    ...Array.from({length:8},()=>{const n=randInt(5,20),arr=Array.from({length:n},()=>randInt(-20,20));return{input:`${n}\n${arr.join(' ')}`,output:`${kadane(arr)}`,is_sample:false}})
    ]
  }
},

// --- graph_basic ---
{
  title: '连通分量数',
  desc: `## 题目描述

给定 $N$ 个顶点、$M$ 条边的无向图，求连通分量的个数。

## 输入格式

第一行两个正整数 $N, M$。接下来 $M$ 行，每行两个整数 $u, v$，表示一条边。

## 输出格式

一行，连通分量个数。

## 数据范围

$1 \\le N \\le 10^3$，$0 \\le M \\le \\frac{N(N-1)}{2}$`,
  difficulty: 'medium', categories: ['graph_basic'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const solve=(n:number,edges:number[][])=>{const p=Array.from({length:n+1},(_,i)=>i);const find=(x:number):number=>p[x]===x?x:p[x]=find(p[x]);for(const[u,v]of edges){p[find(u)]=find(v)}return new Set(Array.from({length:n},(_,i)=>find(i+1))).size}
    return [
      {input:'4 2\n1 2\n3 4',output:'2',is_sample:true},{input:'3 0',output:'3',is_sample:true},
    ...Array.from({length:8},()=>{
      const n=randInt(4,10);const edges=[];for(let i=2;i<=n;i++)if(Math.random()>0.4)edges.push([randInt(1,i-1),i])
      for(let i=0;i<randInt(0,3);i++)edges.push([randInt(1,n),randInt(1,n)])
      return{input:`${n} ${edges.length}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:`${solve(n,edges)}`,is_sample:false}
    })
    ]
  }
},
{
  title: '度数统计',
  desc: `## 题目描述

给定 $N$ 个顶点、$M$ 条边的无向图，求每个顶点的度数。

## 输入格式

第一行两个正整数 $N, M$。接下来 $M$ 行，每行两个整数 $u, v$。

## 输出格式

一行，$N$ 个整数，表示各顶点的度数。

## 数据范围

$1 \\le N \\le 10^5$`,
  difficulty: 'easy', categories: ['graph_basic'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const solve=(n:number,edges:number[][])=>{const deg=new Array(n+1).fill(0);for(const[u,v]of edges){deg[u]++;deg[v]++}return deg.slice(1).join(' ')}
    return [
      {input:'4 3\n1 2\n2 3\n3 4',output:'1 2 2 1',is_sample:true},
    ...Array.from({length:9},()=>{
      const n=randInt(4,8),m=randInt(n-1,n*2);const edges=Array.from({length:m},()=>{let u=randInt(1,n),v=randInt(1,n);while(v===u)v=randInt(1,n);return[u,v]})
      return{input:`${n} ${m}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:solve(n,edges),is_sample:false}
    })
    ]
  }
},

// --- tree_basic ---
{
  title: '树的深度',
  desc: `## 题目描述

给定一棵以节点 $1$ 为根的有根树，求树的深度（从根到最远叶子节点的边数）。

## 输入格式

第一行一个正整数 $N$。接下来 $N-1$ 行，每行两个整数 $u, v$，表示一条树边。

## 输出格式

一行，树的深度。

## 数据范围

$1 \\le N \\le 10^5$`,
  difficulty: 'medium', categories: ['tree_basic'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const depth=(n:number,edges:number[][])=>{
      const adj=Array.from({length:n+1},()=>[] as number[]);for(const[u,v]of edges){adj[u].push(v);adj[v].push(u)}
      const q:[number,number][]=[[1,0]];const vis=new Set<number>([1]);let mx=0;let h=0
      while(h<q.length){const[node,d]=q[h++];mx=Math.max(mx,d);for(const nb of adj[node])if(!vis.has(nb)){vis.add(nb);q.push([nb,d+1])}}return mx
    }
    return [
      {input:'4\n1 2\n1 3\n3 4',output:'2',is_sample:true},{input:'1',output:'0',is_sample:true},
    ...Array.from({length:8},()=>{
      const n=randInt(4,12);const edges=[];for(let i=2;i<=n;i++)edges.push([randInt(1,i-1),i])
      return{input:`${n}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:`${depth(n,edges)}`,is_sample:false}
    })
    ]
  }
},
{
  title: '叶子节点数',
  desc: `## 题目描述

给定一棵以节点 $1$ 为根的有根树，求叶子节点的个数。

## 输入格式

第一行一个正整数 $N$。接下来 $N-1$ 行，每行两个整数 $u, v$，表示一条树边。

## 输出格式

一行，叶子节点数。

## 数据范围

$2 \\le N \\le 10^5$`,
  difficulty: 'easy', categories: ['tree_basic'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const leaves=(n:number,edges:number[][])=>{
      const deg=new Array(n+1).fill(0);for(const[u,v]of edges){deg[u]++;deg[v]++}
      if(n===1)return 1;let c=0;for(let i=2;i<=n;i++)if(deg[i]===1)c++;return c
    }
    return [
      {input:'5\n1 2\n1 3\n2 4\n2 5',output:'3',is_sample:true},
    ...Array.from({length:9},()=>{
      const n=randInt(3,15);const edges=[];for(let i=2;i<=n;i++)edges.push([randInt(1,i-1),i])
      return{input:`${n}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:`${leaves(n,edges)}`,is_sample:false}
    })
    ]
  }
},

// --- number_theory ---
{
  title: '素数筛',
  desc: `## 题目描述

给定 $N$，求 $1$ 到 $N$ 中素数的个数。

## 输入格式

一行，一个正整数 $N$。

## 输出格式

一行，素数个数。

## 数据范围

$1 \\le N \\le 10^7$`,
  difficulty: 'easy', categories: ['number_theory'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const sieve=(n:number)=>{if(n<2)return 0;const p=new Uint8Array(n+1);let c=0;for(let i=2;i<=n;i++){if(!p[i]){c++;for(let j=i*2;j<=n;j+=i)p[j]=1}}return c}
    return [
      {input:'10',output:'4',is_sample:true},{input:'1',output:'0',is_sample:true},
    ...[2,100,1000,50,30,5,20,97].map(n=>({input:`${n}`,output:`${sieve(n)}`,is_sample:false}))
    ]
  }
},
{
  title: '最大公约数之和',
  desc: `## 题目描述

给定正整数 $N$，求 $\\sum_{i=1}^{N} \\gcd(i, N)$。

## 输入格式

一行，一个正整数 $N$。

## 输出格式

一行，GCD 之和。

## 数据范围

$1 \\le N \\le 10^6$`,
  difficulty: 'medium', categories: ['number_theory'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gcd=(a:number,b:number):number=>b===0?a:gcd(b,a%b)
    const sum=(n:number)=>{let s=0;for(let i=1;i<=n;i++)s+=gcd(i,n);return s}
    return [
      {input:'6',output:`${sum(6)}`,is_sample:true},{input:'1',output:'1',is_sample:true},
    ...[2,3,4,5,10,12,100,1000].map(n=>({input:`${n}`,output:`${sum(n)}`,is_sample:false}))
    ]
  }
},

// --- stl ---
{
  title: '栈操作',
  desc: `## 题目描述

模拟栈操作：\`push x\` 将 $x$ 入栈，\`pop\` 弹出栈顶，\`top\` 查询栈顶，\`size\` 查询大小。

## 输入格式

第一行一个正整数 $Q$，表示操作数。接下来 $Q$ 行，每行一个操作。

## 输出格式

对于 \`top\` 和 \`size\` 操作，输出一行结果。栈空时 \`pop\` 和 \`top\` 无效（跳过）。

## 数据范围

$1 \\le Q \\le 10^5$`,
  difficulty: 'easy', categories: ['stl'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{
      const q=randInt(3,10);const ops:string[]=[];const out:string[]=[];const stk:number[]=[]
      for(let i=0;i<q;i++){
        const t=randInt(0,3)
        if(t===0){const x=randInt(1,99);ops.push(`push ${x}`);stk.push(x)}
        else if(t===1){ops.push('pop');if(stk.length)stk.pop()}
        else if(t===2){ops.push('top');if(stk.length)out.push(`${stk[stk.length-1]}`)}
        else{ops.push('size');out.push(`${stk.length}`)}
      }
      return{input:`${q}\n${ops.join('\n')}`,output:out.join('\n')||'',is_sample:false}
    }
    return [
      {input:'5\npush 1\npush 2\ntop\npop\ntop',output:'2\n1',is_sample:true},
      {input:'3\npush 10\nsize\ntop',output:'1\n10',is_sample:true},
      ...Array.from({length:8},gen1)
    ]
  }
},
{
  title: '优先队列',
  desc: `## 题目描述

模拟一个最大堆优先队列：\`push x\` 插入 $x$，\`pop\` 弹出最大值，\`top\` 输出当前最大值。

## 输入格式

第一行一个正整数 $Q$。接下来 $Q$ 行，每行一个操作。

## 输出格式

对于 \`top\` 操作，输出一行结果。空队列时 \`pop\` 和 \`top\` 无效。

## 数据范围

$1 \\le Q \\le 10^5$`,
  difficulty: 'easy', categories: ['stl'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{
      const q=randInt(3,10);const ops:string[]=[];const out:string[]=[];const pq:number[]=[]
      const sink=(i:number)=>{while(2*i+1<pq.length){let m=2*i+1;if(m+1<pq.length&&pq[m+1]>pq[m])m++;if(pq[i]>=pq[m])break;[pq[i],pq[m]]=[pq[m],pq[i]];i=m}}
      const swim=(i:number)=>{while(i>0){const p=(i-1)>>1;if(pq[p]>=pq[i])break;[pq[p],pq[i]]=[pq[i],pq[p]];i=p}}
      for(let i=0;i<q;i++){
        const t=randInt(0,2)
        if(t===0){const x=randInt(1,99);ops.push(`push ${x}`);pq.push(x);swim(pq.length-1)}
        else if(t===1){ops.push('pop');if(pq.length){[pq[0],pq[pq.length-1]]=[pq[pq.length-1],pq[0]];pq.pop();sink(0)}}
        else{ops.push('top');if(pq.length)out.push(`${pq[0]}`)}
      }
      return{input:`${q}\n${ops.join('\n')}`,output:out.join('\n')||'',is_sample:false}
    }
    return [
      {input:'5\npush 3\npush 5\ntop\npop\ntop',output:'5\n3',is_sample:true},
      ...Array.from({length:9},gen1)
    ]
  }
},

// ======================== 算法提高 ========================
// (Advanced categories - using simpler but correct problems)

// --- dp_knapsack ---
{
  title: '0/1背包',
  desc: `## 题目描述

有 $N$ 个物品，每个物品有重量 $w_i$ 和价值 $v_i$。背包容量为 $W$，每个物品只能选一次，求最大价值。

## 输入格式

第一行两个正整数 $N, W$。接下来 $N$ 行，每行两个整数 $w_i, v_i$。

## 输出格式

一行，最大价值。

## 数据范围

$1 \\le N \\le 100$，$1 \\le W \\le 1000$`,
  difficulty: 'medium', categories: ['dp_knapsack'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const solve=(W:number,items:number[][])=>{const dp=new Array(W+1).fill(0);for(const[w,v]of items)for(let j=W;j>=w;j--)dp[j]=Math.max(dp[j],dp[j-w]+v);return dp[W]}
    return [
      {input:'3 5\n2 3\n3 4\n4 5',output:'7',is_sample:true},
    ...Array.from({length:9},()=>{
      const n=randInt(3,8),W=randInt(5,20);const items=Array.from({length:n},()=>[randInt(1,10),randInt(1,20)])
      return{input:`${n} ${W}\n${items.map(e=>e.join(' ')).join('\n')}`,output:`${solve(W,items)}`,is_sample:false}
    })
    ]
  }
},
{
  title: '完全背包',
  desc: `## 题目描述

有 $N$ 种物品，每种有重量 $w_i$ 和价值 $v_i$，数量无限。背包容量为 $W$，求最大价值。

## 输入格式

第一行两个正整数 $N, W$。接下来 $N$ 行，每行 $w_i, v_i$。

## 输出格式

一行，最大价值。

## 数据范围

$1 \\le N \\le 100$，$1 \\le W \\le 1000$`,
  difficulty: 'medium', categories: ['dp_knapsack'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const solve=(W:number,items:number[][])=>{const dp=new Array(W+1).fill(0);for(const[w,v]of items)for(let j=w;j<=W;j++)dp[j]=Math.max(dp[j],dp[j-w]+v);return dp[W]}
    return [
      {input:'2 10\n2 3\n5 7',output:'15',is_sample:true},
    ...Array.from({length:9},()=>{
      const n=randInt(2,6),W=randInt(5,20);const items=Array.from({length:n},()=>[randInt(1,8),randInt(1,15)])
      return{input:`${n} ${W}\n${items.map(e=>e.join(' ')).join('\n')}`,output:`${solve(W,items)}`,is_sample:false}
    })
    ]
  }
},

// --- shortest_path ---
{
  title: '最短路',
  desc: `## 题目描述

给定 $N$ 个点、$M$ 条带权有向边的图，求从节点 $1$ 到节点 $N$ 的最短路径长度。若不可达输出 \`-1\`。

## 输入格式

第一行两个正整数 $N, M$。接下来 $M$ 行，每行三个整数 $u, v, w$，表示一条从 $u$ 到 $v$ 权值为 $w$ 的边。

## 输出格式

一行，最短路径长度或 \`-1\`。

## 数据范围

$2 \\le N \\le 100$，$1 \\le M \\le 1000$，$1 \\le w \\le 100$`,
  difficulty: 'medium', categories: ['shortest_path'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const dijkstra=(n:number,edges:number[][])=>{
      const adj=Array.from({length:n+1},()=>[] as [number,number][]);for(const[u,v,w]of edges)adj[u].push([v,w])
      const dist=new Array(n+1).fill(Infinity);dist[1]=0;const vis=new Set<number>()
      for(let i=0;i<n;i++){let u=-1;for(let j=1;j<=n;j++)if(!vis.has(j)&&(u===-1||dist[j]<dist[u]))u=j
      if(u===-1||dist[u]===Infinity)break;vis.add(u);for(const[v,w]of adj[u])if(dist[u]+w<dist[v])dist[v]=dist[u]+w}
      return dist[n]===Infinity?-1:dist[n]
    }
    const gen1=()=>{
      const n=randInt(3,8),m=randInt(n-1,n*2);const edges:number[][]=[]
      for(let i=2;i<=n;i++)edges.push([randInt(1,i-1),i,randInt(1,10)])
      for(let i=0;i<m-(n-1);i++){const u=randInt(1,n),v=randInt(1,n);if(u!==v)edges.push([u,v,randInt(1,10)])}
      return{input:`${n} ${edges.length}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:`${dijkstra(n,edges)}`,is_sample:false}
    }
    return [
      {input:'3 3\n1 2 1\n2 3 2\n1 3 5',output:'3',is_sample:true},
    ...Array.from({length:9},gen1)
    ]
  }
},
{
  title: 'Floyd 全源最短路',
  desc: `## 题目描述

给定 $N$ 个点、$M$ 条带权无向边的图，求任意两点间的最短路径长度矩阵。

## 输入格式

第一行两个正整数 $N, M$。接下来 $M$ 行，每行三个整数 $u, v, w$。

## 输出格式

$N$ 行，每行 $N$ 个整数。$dist[i][j]$ 为 $i$ 到 $j$ 的最短路，不可达输出 \`-1\`。

## 数据范围

$2 \\le N \\le 50$，$1 \\le w \\le 100$`,
  difficulty: 'medium', categories: ['shortest_path'], time_limit: 2000, memory_limit: 256,
  gen: () => {
    const floyd=(n:number,edges:number[][])=>{
      const d=Array.from({length:n},(_,i)=>Array.from({length:n},(__,j)=>i===j?0:Infinity))
      for(const[u,v,w]of edges){d[u-1][v-1]=Math.min(d[u-1][v-1],w);d[v-1][u-1]=Math.min(d[v-1][u-1],w)}
      for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(d[i][k]+d[k][j]<d[i][j])d[i][j]=d[i][k]+d[k][j]
      return d.map(r=>r.map(x=>x===Infinity?-1:x).join(' ')).join('\n')
    }
    const gen1=()=>{
      const n=randInt(3,6),m=randInt(n-1,n+2);const edges:number[][]=[];for(let i=2;i<=n;i++)edges.push([i,randInt(1,i-1),randInt(1,10)])
      for(let i=0;i<m-(n-1);i++){const u=randInt(1,n),v=randInt(1,n);if(u!==v)edges.push([u,v,randInt(1,10)])}
      return{input:`${n} ${edges.length}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:floyd(n,edges),is_sample:false}
    }
    return [
      {input:'3 3\n1 2 1\n2 3 2\n1 3 5',output:'0 1 3\n1 0 2\n3 2 0',is_sample:true},
      ...Array.from({length:9},gen1)
    ]
  }
},

// --- remaining advanced categories: use compact generic problems ---
// For the remaining ~20 advanced categories, create 2 problems each

// --- mst ---
{
  title: '最小生成树',
  desc: `## 题目描述

给定 $N$ 个点、$M$ 条带权无向边的图，求最小生成树的权值之和。若图不连通输出 \`-1\`。

## 输入格式

第一行 $N, M$。接下来 $M$ 行 $u, v, w$。

## 输出格式

一行，最小生成树权值或 \`-1\`。

## 数据范围

$2 \\le N \\le 100$，$1 \\le w \\le 1000$`,
  difficulty: 'medium', categories: ['mst'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const kruskal=(n:number,edges:number[][])=>{
      edges.sort((a,b)=>a[2]-b[2]);const p=Array.from({length:n+1},(_,i)=>i)
      const find=(x:number):number=>p[x]===x?x:p[x]=find(p[x]);let c=0,cnt=0
      for(const[u,v,w]of edges){const pu=find(u),pv=find(v);if(pu!==pv){p[pu]=pv;c+=w;cnt++}}
      return cnt===n-1?c:-1
    }
    const gen1=()=>{
      const n=randInt(3,10),m=randInt(n-1,n+3);const edges=Array.from({length:m},()=>{let u=randInt(1,n),v=randInt(1,n);while(v===u)v=randInt(1,n);return[u,v,randInt(1,20)]})
      return{input:`${n} ${m}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:`${kruskal(n,edges)}`,is_sample:false}
    }
    return [
      {input:'3 3\n1 2 1\n2 3 2\n1 3 3',output:'3',is_sample:true},
      ...Array.from({length:9},gen1)
    ]
  }
},
{
  title: 'Kruskal模板',
  desc: `## 题目描述

给定 $N$ 个点和 $M$ 条无向边，判断图是否连通，若连通则输出最小生成树权值。

## 输入格式

第一行 $N, M$。接下来 $M$ 行 $u, v, w$。

## 输出格式

连通输出权值，否则输出 \`disconnected\`。

## 数据范围

$1 \\le N \\le 200$`,
  difficulty: 'medium', categories: ['mst'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const solve=(n:number,edges:number[][])=>{
      edges.sort((a,b)=>a[2]-b[2]);const p=Array.from({length:n+1},(_,i)=>i);const find=(x:number):number=>p[x]===x?x:p[x]=find(p[x])
      let c=0,cnt=0;for(const[u,v,w]of edges){const pu=find(u),pv=find(v);if(pu!==pv){p[pu]=pv;c+=w;cnt++}}
      return cnt===n-1?`${c}`:'disconnected'
    }
    const gen1=()=>{
      const n=randInt(3,8),m=randInt(randInt(0,1),n+2);const edges=Array.from({length:m},()=>{let u=randInt(1,n),v=randInt(1,n);while(v===u)v=randInt(1,n);return[u,v,randInt(1,15)]})
      return{input:`${n} ${m}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:solve(n,edges),is_sample:false}
    }
    return [{input:'4 3\n1 2 1\n2 3 2\n3 4 3',output:'6',is_sample:true},...Array.from({length:9},gen1)]
  }
},

// --- seg_tree ---
{
  title: '区间求和',
  desc: `## 题目描述

给定 $N$ 个数的数组，支持 $Q$ 次操作：\`1 L R\` 查询区间 $[L,R]$ 的和；\`2 i v\` 将第 $i$ 个数改为 $v$。

## 输入格式

第一行 $N, Q$。第二行 $N$ 个整数。接下来 $Q$ 行操作。

## 输出格式

对于查询操作，输出一行结果。

## 数据范围

$1 \\le N, Q \\le 10^5$`,
  difficulty: 'hard', categories: ['seg_tree','fenwick'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{
      const n=randInt(5,15),q=randInt(3,8);const arr=randArr(n,1,20)
      const a=[...arr];const out:string[]=[];const ops:string[]=[]
      for(let i=0;i<q;i++){if(Math.random()>0.5){const l=randInt(1,n),r=randInt(l,n);ops.push(`1 ${l} ${r}`);out.push(`${a.slice(l-1,r).reduce((s,x)=>s+x,0)}`)}else{const idx=randInt(1,n),v=randInt(1,30);ops.push(`2 ${idx} ${v}`);a[idx-1]=v}}
      return{input:`${n} ${q}\n${arr.join(' ')}\n${ops.join('\n')}`,output:out.join('\n')||'',is_sample:false}
    }
    return [
      {input:'5 3\n1 2 3 4 5\n1 1 3\n2 2 10\n1 1 3',output:'6\n14',is_sample:true},
      ...Array.from({length:9},gen1)
    ]
  }
},
{
  title: '区间最大值',
  desc: `## 题目描述

给定 $N$ 个数的数组，支持 $Q$ 次操作：\`1 L R\` 查询区间最大值；\`2 i v\` 单点修改。

## 输入格式

第一行 $N, Q$。第二行 $N$ 个整数。接下来 $Q$ 行操作。

## 输出格式

对于查询操作，输出一行结果。

## 数据范围

$1 \\le N, Q \\le 10^5$`,
  difficulty: 'hard', categories: ['seg_tree','sparse_table'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{
      const n=randInt(5,15),q=randInt(3,8);const arr=randArr(n,1,50)
      const a=[...arr];const out:string[]=[];const ops:string[]=[]
      for(let i=0;i<q;i++){if(Math.random()>0.5){const l=randInt(1,n),r=randInt(l,n);ops.push(`1 ${l} ${r}`);out.push(`${Math.max(...a.slice(l-1,r))}`)}else{const idx=randInt(1,n),v=randInt(1,50);ops.push(`2 ${idx} ${v}`);a[idx-1]=v}}
      return{input:`${n} ${q}\n${arr.join(' ')}\n${ops.join('\n')}`,output:out.join('\n')||'',is_sample:false}
    }
    return [
      {input:'5 3\n3 1 4 1 5\n1 1 5\n2 3 0\n1 1 5',output:'5\n5',is_sample:true},
      ...Array.from({length:9},gen1)
    ]
  }
},

// --- topo_sort ---
{
  title: '拓扑排序',
  desc: `## 题目描述

给定 $N$ 个点和 $M$ 条有向边，输出一个拓扑序。若有环输出 \`-1\`。

## 输入格式

第一行 $N, M$。接下来 $M$ 行 $u, v$。

## 输出格式

一行拓扑序（节点编号以空格分隔）或 \`-1\`。

## 数据范围

$1 \\le N \\le 100$`,
  difficulty: 'medium', categories: ['topo_sort'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const topo=(n:number,edges:number[][])=>{
      const indeg=new Array(n+1).fill(0);const adj=Array.from({length:n+1},()=>[] as number[])
      for(const[u,v]of edges){adj[u].push(v);indeg[v]++}
      const q:number[]=[];for(let i=1;i<=n;i++)if(indeg[i]===0)q.push(i)
      const res:number[]=[];let h=0
      while(h<q.length){const u=q[h++];res.push(u);for(const v of adj[u]){indeg[v]--;if(indeg[v]===0)q.push(v)}}
      return res.length===n?res.join(' '):'-1'
    }
    const gen1=()=>{
      const n=randInt(3,8);const edges:number[][]=[];for(let i=2;i<=n;i++)edges.push([randInt(1,i-1),i])
      for(let i=0;i<randInt(0,3);i++){const u=randInt(1,n),v=randInt(1,n);if(u!==v)edges.push([u,v])}
      return{input:`${n} ${edges.length}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:topo(n,edges),is_sample:false}
    }
    return [{input:'4 3\n1 2\n2 3\n1 4',output:'1 2 4 3',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '有向无环图判断',
  desc: `## 题目描述

给定 $N$ 个点 $M$ 条有向边，判断是否为 DAG（有向无环图）。

## 输入格式

第一行 $N, M$。接下来 $M$ 行 $u, v$。

## 输出格式

是 DAG 输出 \`Yes\`，否则输出 \`No\`。

## 数据范围

$1 \\le N \\le 1000$`,
  difficulty: 'medium', categories: ['topo_sort'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const isDAG=(n:number,edges:number[][])=>{
      const indeg=new Array(n+1).fill(0);const adj=Array.from({length:n+1},()=>[] as number[])
      for(const[u,v]of edges){adj[u].push(v);indeg[v]++}
      const q:number[]=[];for(let i=1;i<=n;i++)if(indeg[i]===0)q.push(i)
      let cnt=0,h=0;while(h<q.length){const u=q[h++];cnt++;for(const v of adj[u]){indeg[v]--;if(indeg[v]===0)q.push(v)}}
      return cnt===n?'Yes':'No'
    }
    const gen1=()=>{
      const n=randInt(3,8);const edges:number[][]=[];for(let i=2;i<=n;i++)edges.push([randInt(1,i-1),i])
      return{input:`${n} ${edges.length}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:isDAG(n,edges),is_sample:false}
    }
    return [
      {input:'3 2\n1 2\n2 3',output:'Yes',is_sample:true},{input:'2 2\n1 2\n2 1',output:'No',is_sample:true},
      ...Array.from({length:8},gen1)
    ]
  }
},

// --- fill remaining categories with generic problems ---

// --- search_advanced ---
{
  title: 'N皇后问题',
  desc: `## 题目描述

给定 $N$，在 $N \\times N$ 棋盘上放置 $N$ 个皇后使其互不攻击，求方案数。

## 输入格式

一行，正整数 $N$。

## 输出格式

一行，方案数。

## 数据范围

$1 \\le N \\le 12$`,
  difficulty: 'hard', categories: ['search_advanced'], time_limit: 2000, memory_limit: 256,
  gen: () => {
    const nqueens=(n:number)=>{let c=0;const cols=new Set<number>(),d1=new Set<number>(),d2=new Set<number>()
    const dfs=(r:number)=>{if(r===n){c++;return}for(let c=0;c<n;c++){if(cols.has(c)||d1.has(r+c)||d2.has(r-c))continue;cols.add(c);d1.add(r+c);d2.add(r-c);dfs(r+1);cols.delete(c);d1.delete(r+c);d2.delete(r-c)}}
    dfs(0);return c}
    return [
      {input:'4',output:'2',is_sample:true},{input:'8',output:'92',is_sample:true},
    ...[1,2,3,5,6,7,9,10].map(n=>({input:`${n}`,output:`${nqueens(n)}`,is_sample:false}))
    ]
  }
},
{
  title: '数独验证',
  desc: `## 题目描述

给定一个 $9 \\times 9$ 的数独，验证是否合法（每行、每列、每个 $3 \\times 3$ 宫内数字 $1-9$ 不重复）。

## 输入格式

$9$ 行，每行 $9$ 个整数。

## 输出格式

合法输出 \`Yes\`，否则 \`No\`。

## 数据范围

$0 \\le a_{ij} \\le 9$，$0$ 表示空格。`,
  difficulty: 'medium', categories: ['search_advanced'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const valid=(g:number[][])=>{
      for(let i=0;i<9;i++){const sr=new Set<number>(),sc=new Set<number>();for(let j=0;j<9;j++){if(g[i][j]){if(sr.has(g[i][j]))return'No';sr.add(g[i][j])}if(g[j][i]){if(sc.has(g[j][i]))return'No';sc.add(g[j][i])}}}
      for(let bi=0;bi<3;bi++)for(let bj=0;bj<3;bj++){const s=new Set<number>();for(let i=0;i<3;i++)for(let j=0;j<3;j++){const v=g[bi*3+i][bj*3+j];if(v){if(s.has(v))return'No';s.add(v)}}}
      return'Yes'
    }
    const gen1=()=>{const g=Array.from({length:9},()=>Array.from({length:9},()=>randInt(0,9)));return{input:g.map(r=>r.join(' ')).join('\n'),output:valid(g),is_sample:false}}
    return [
      {input:'5 3 0 0 7 0 0 0 0\n6 0 0 1 9 5 0 0 0\n0 9 8 0 0 0 0 6 0\n8 0 0 0 6 0 0 0 3\n4 0 0 8 0 3 0 0 1\n7 0 0 0 2 0 0 0 6\n0 6 0 0 0 0 2 8 0\n0 0 0 4 1 9 0 0 5\n0 0 0 0 8 0 0 7 9',output:'Yes',is_sample:true},
      ...Array.from({length:9},gen1)
    ]
  }
},

// --- string hashing, KMP, Trie ---
{
  title: '子串匹配',
  desc: `## 题目描述

给定文本串 $S$ 和模式串 $T$，求 $T$ 在 $S$ 中出现的次数。

## 输入格式

第一行文本串 $S$。第二行模式串 $T$。

## 输出格式

一行，出现次数。

## 数据范围

$1 \\le |S|, |T| \\le 10^5$`,
  difficulty: 'medium', categories: ['string_hash','kmp'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const count=(s:string,t:string)=>{let c=0;for(let i=0;i<=s.length-t.length;i++)if(s.slice(i,i+t.length)===t)c++;return c}
    return [
      {input:'abababa\naba',output:'3',is_sample:true},{input:'aaaa\naa',output:'3',is_sample:true},
    ...[['hello world','l'],['abcabcabc','abc'],['aaaaa','aa'],['xyz','a'],['abababab','abab'],['mississippi','ss'],['aaaab','aab'],['123123123','123']].map(([s,t])=>({input:`${s}\n${t}`,output:`${count(s,t)}`,is_sample:false}))
    ]
  }
},
{
  title: '字符串哈希判等',
  desc: `## 题目描述

给定字符串 $S$ 和 $Q$ 个查询，每个查询给 $l_1, r_1, l_2, r_2$，判断子串 $S[l_1..r_1]$ 和 $S[l_2..r_2]$ 是否相同（下标从 1 开始）。

## 输入格式

第一行字符串 $S$。第二行 $Q$。接下来 $Q$ 行每行四个整数。

## 输出格式

$Q$ 行，相同输出 \`Yes\`，否则 \`No\`。

## 数据范围

$1 \\le |S| \\le 10^5$`,
  difficulty: 'medium', categories: ['string_hash'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{
      const s=Array.from({length:randInt(5,15)},()=>String.fromCharCode(97+randInt(0,3))).join('')
      const q=randInt(2,5);const out:string[]=[];const ops:string[]=[]
      for(let i=0;i<q;i++){const l1=randInt(1,s.length),r1=randInt(l1,s.length),l2=randInt(1,s.length),r2=randInt(l2,s.length)
      ops.push(`${l1} ${r1} ${l2} ${r2}`);out.push(s.slice(l1-1,r1)===s.slice(l2-1,r2)?'Yes':'No')}
      return{input:`${s}\n${q}\n${ops.join('\n')}`,output:out.join('\n'),is_sample:false}
    }
    return [{input:'ababa\n2\n1 3 3 5\n1 2 4 5',output:'Yes\nNo',is_sample:true},...Array.from({length:9},gen1)]
  }
},

// --- lca ---
{
  title: '最近公共祖先',
  desc: `## 题目描述

给定一棵以 $1$ 为根的有根树，$Q$ 次询问两个节点的最近公共祖先。

## 输入格式

第一行 $N, Q$。接下来 $N-1$ 行树边。接下来 $Q$ 行每行两个整数 $u, v$。

## 输出格式

$Q$ 行，每行 LCA。

## 数据范围

$2 \\le N \\le 1000$`,
  difficulty: 'hard', categories: ['lca','doubling'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const lca=(n:number,edges:number[][],qs:number[][])=>{
      const adj=Array.from({length:n+1},()=>[] as number[]);const parent=new Array(n+1).fill(0);const depth=new Array(n+1).fill(0)
      for(const[u,v]of edges){adj[u].push(v);adj[v].push(u)}
      const dfs=(u:number,p:number,d:number)=>{parent[u]=p;depth[u]=d;for(const v of adj[u])if(v!==p)dfs(v,u,d+1)}
      dfs(1,0,0)
      const find=(u:number,v:number)=>{while(depth[u]>depth[v])u=parent[u];while(depth[v]>depth[u])v=parent[v];while(u!==v){u=parent[u];v=parent[v]}return u}
      return qs.map(([u,v])=>find(u,v)).join('\n')
    }
    const gen1=()=>{
      const n=randInt(4,12);const edges:number[][]=[];for(let i=2;i<=n;i++)edges.push([randInt(1,i-1),i])
      const q=randInt(2,5);const qs=Array.from({length:q},()=>[randInt(1,n),randInt(1,n)])
      return{input:`${n} ${q}\n${edges.map(e=>e.join(' ')).join('\n')}\n${qs.map(e=>e.join(' ')).join('\n')}`,output:lca(n,edges,qs),is_sample:false}
    }
    return [{input:'5 2\n1 2\n1 3\n2 4\n2 5\n4 5\n3 4',output:'2\n1',is_sample:true},...Array.from({length:9},gen1)]
  }
},

// --- remaining: bipartite, scc, trie, manacher, sweep_line, offline, fenwick, sparse_table, balanced_tree, hld, dp_tree, dp_interval, dp_state, dp_digit ---

// Generic problems for remaining categories
{
  title: '二分图判定',
  desc: `## 题目描述

给定无向图，判断是否为二分图。

## 输入格式

第一行 $N, M$。接下来 $M$ 行 $u, v$。

## 输出格式

是二分图输出 \`Yes\`，否则 \`No\`。

## 数据范围

$1 \\le N \\le 100$`,
  difficulty: 'medium', categories: ['bipartite'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const isBip=(n:number,edges:number[][])=>{
      const adj=Array.from({length:n+1},()=>[] as number[]);for(const[u,v]of edges){adj[u].push(v);adj[v].push(u)}
      const color=new Array(n+1).fill(-1)
      for(let s=1;s<=n;s++){if(color[s]!==-1)continue;color[s]=0;const q=[s];let h=0
      while(h<q.length){const u=q[h++];for(const v of adj[u]){if(color[v]===-1){color[v]=1-color[u];q.push(v)}else if(color[v]===color[u])return'No'}}}
      return'Yes'
    }
    const gen1=()=>{const n=randInt(3,8),m=randInt(n-1,n+2);const edges=Array.from({length:m},()=>{let u=randInt(1,n),v=randInt(1,n);while(v===u)v=randInt(1,n);return[u,v]});return{input:`${n} ${m}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:isBip(n,edges),is_sample:false}}
    return [{input:'3 2\n1 2\n2 3',output:'Yes',is_sample:true},{input:'3 3\n1 2\n2 3\n3 1',output:'No',is_sample:true},...Array.from({length:8},gen1)]
  }
},
{
  title: '二分图最大匹配',
  desc: `## 题目描述

给定一个二分图，左边 $N$ 个点，右边 $M$ 个点，$E$ 条边。求最大匹配数。

## 输入格式

第一行 $N, M, E$。接下来 $E$ 行 $u, v$（$1 \\le u \\le N$, $1 \\le v \\le M$）。

## 输出格式

一行，最大匹配数。

## 数据范围

$1 \\le N, M \\le 100$`,
  difficulty: 'hard', categories: ['bipartite'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const match=(n:number,m:number,edges:number[][])=>{
      const adj=Array.from({length:n+1},()=>[] as number[]);for(const[u,v]of edges)adj[u].push(v)
      const mate=new Array(m+1).fill(0);let c=0
      const dfs=(u:number,vis:Set<number>)=>{for(const v of adj[u])if(!vis.has(v)){vis.add(v);if(mate[v]===0||dfs(mate[v],vis)){mate[v]=u;return true}}return false}
      for(let u=1;u<=n;u++){const vis=new Set<number>();if(dfs(u,vis))c++}return c
    }
    const gen1=()=>{const n=randInt(3,6),m=randInt(3,6),e=randInt(2,n+m);const edges=Array.from({length:e},()=>[randInt(1,n),randInt(1,m)]);return{input:`${n} ${m} ${e}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:`${match(n,m,edges)}`,is_sample:false}}
    return [{input:'2 2 3\n1 1\n1 2\n2 1',output:'2',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '强连通分量',
  desc: `## 题目描述

给定 $N$ 个点 $M$ 条有向边的图，求强连通分量个数。

## 输入格式

第一行 $N, M$。接下来 $M$ 行 $u, v$。

## 输出格式

一行，SCC 个数。

## 数据范围

$1 \\le N \\le 100$`,
  difficulty: 'hard', categories: ['scc'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const scc=(n:number,edges:number[][])=>{
      const adj=Array.from({length:n+1},()=>[] as number[]);const radj=Array.from({length:n+1},()=>[] as number[])
      for(const[u,v]of edges){adj[u].push(v);radj[v].push(u)}
      const order:number[]=[];const vis=new Set<number>()
      const dfs1=(u:number)=>{vis.add(u);for(const v of adj[u])if(!vis.has(v))dfs1(v);order.push(u)}
      for(let i=1;i<=n;i++)if(!vis.has(i))dfs1(i)
      const vis2=new Set<number>();let cnt=0
      const dfs2=(u:number)=>{vis2.add(u);for(const v of radj[u])if(!vis2.has(v))dfs2(v)}
      for(let i=order.length-1;i>=0;i--){if(!vis2.has(order[i])){dfs2(order[i]);cnt++}}return cnt
    }
    const gen1=()=>{const n=randInt(3,8),m=randInt(n-1,n+2);const edges=Array.from({length:m},()=>{let u=randInt(1,n),v=randInt(1,n);while(v===u)v=randInt(1,n);return[u,v]});return{input:`${n} ${m}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:`${scc(n,edges)}`,is_sample:false}}
    return [{input:'5 5\n1 2\n2 3\n3 1\n3 4\n4 5',output:'3',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '字典树插入与查找',
  desc: `## 题目描述

维护一个字符串集合，支持 $Q$ 次操作：\`insert s\` 插入字符串，\`query s\` 查询字符串是否存在。

## 输入格式

第一行 $Q$。接下来 $Q$ 行操作。

## 输出格式

对于 \`query\` 操作，存在输出 \`Yes\`，否则 \`No\`。

## 数据范围

$1 \\le Q \\le 10^4$`,
  difficulty: 'medium', categories: ['trie'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{
      const q=randInt(4,10);const words=new Set<string>();const ops:string[]=[];const out:string[]=[]
      for(let i=0;i<q;i++){const w=Array.from({length:randInt(2,5)},()=>String.fromCharCode(97+randInt(0,4))).join('')
      if(Math.random()>0.4){ops.push(`insert ${w}`);words.add(w)}else{ops.push(`query ${w}`);out.push(words.has(w)?'Yes':'No')}}
      return{input:`${q}\n${ops.join('\n')}`,output:out.join('\n')||'',is_sample:false}
    }
    return [{input:'5\ninsert abc\nquery abc\nquery ab\ninsert ab\nquery ab',output:'Yes\nNo\nYes',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '最长回文子串',
  desc: `## 题目描述

给定一个字符串，求最长回文子串的长度。

## 输入格式

一行，一个字符串。

## 输出格式

一行，最长回文子串长度。

## 数据范围

$1 \\le |s| \\le 1000$`,
  difficulty: 'hard', categories: ['manacher'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const lp=(s:string)=>{let mx=0;for(let i=0;i<s.length;i++){let l=i,r=i;while(l>=0&&r<s.length&&s[l]===s[r]){mx=Math.max(mx,r-l+1);l--;r++}l=i;r=i+1;while(l>=0&&r<s.length&&s[l]===s[r]){mx=Math.max(mx,r-l+1);l--;r++}}return mx}
    return [{input:'babad',output:'3',is_sample:true},{input:'cbbd',output:'2',is_sample:true},
    ...['a','aa','ab','aba','abcba','aaaa','abcd','aabbaa','racecar'].map(s=>({input:s,output:`${lp(s)}`,is_sample:false}))]
  }
},
{
  title: '区间合并',
  desc: `## 题目描述

给定 $N$ 个区间 $[l_i, r_i]$，合并所有重叠的区间后输出。

## 输入格式

第一行 $N$。接下来 $N$ 行 $l_i, r_i$。

## 输出格式

合并后的区间，每行一个。

## 数据范围

$1 \\le N \\le 10^5$`,
  difficulty: 'medium', categories: ['sweep_line','greedy'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const merge=(intervals:number[][])=>{intervals.sort((a,b)=>a[0]-b[0]);const res=[intervals[0]];for(let i=1;i<intervals.length;i++){const last=res[res.length-1];if(intervals[i][0]<=last[1])last[1]=Math.max(last[1],intervals[i][1]);else res.push(intervals[i])}return res.map(r=>r.join(' ')).join('\n')}
    const gen1=()=>{const n=randInt(3,8);const intervals=Array.from({length:n},()=>{const l=randInt(1,20),r=l+randInt(1,5);return[l,r]});return{input:`${n}\n${intervals.map(e=>e.join(' ')).join('\n')}`,output:merge(intervals),is_sample:false}}
    return [{input:'3\n1 3\n2 6\n8 10',output:'1 6\n8 10',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '离线查询',
  desc: `## 题目描述

给定数组 $a_1, a_2, \\cdots, a_N$，和 $Q$ 个查询，每个查询问 $a_l + a_{l+1} + \\cdots + a_r$。用前缀和离线处理。

## 输入格式

第一行 $N, Q$。第二行 $N$ 个整数。接下来 $Q$ 行 $l, r$。

## 输出格式

$Q$ 行，每行区间和。

## 数据范围

$1 \\le N, Q \\le 10^5$`,
  difficulty: 'easy', categories: ['offline'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{const n=randInt(5,15),q=randInt(3,6);const arr=randArr(n,-10,20)
    const pre=arr.reduce((a,x)=>{a.push((a[a.length-1]||0)+x);return a},[] as number[])
    const qs=Array.from({length:q},()=>{const l=randInt(1,n),r=randInt(l,n);return[l,r]})
    return{input:`${n} ${q}\n${arr.join(' ')}\n${qs.map(e=>e.join(' ')).join('\n')}`,output:qs.map(([l,r])=>`${pre[r-1]-(pre[l-2]||0)}`).join('\n'),is_sample:false}}
    return [{input:'5 2\n1 2 3 4 5\n1 3\n2 5',output:'6\n14',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '树形DP-最大独立集',
  desc: `## 题目描述

给定一棵以 $1$ 为根的有根树，求最大独立集（选最多的节点使得没有两个相邻）。

## 输入格式

第一行 $N$。接下来 $N-1$ 行树边。

## 输出格式

一行，最大独立集大小。

## 数据范围

$1 \\le N \\le 10^4$`,
  difficulty: 'hard', categories: ['dp_tree','tree_basic'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const mis=(n:number,edges:number[][])=>{
      const adj=Array.from({length:n+1},()=>[] as number[]);for(const[u,v]of edges){adj[u].push(v);adj[v].push(u)}
      const dp=Array.from({length:n+1},()=>[0,0])
      const dfs=(u:number,p:number)=>{dp[u][1]=1;for(const v of adj[u])if(v!==p){dfs(v,u);dp[u][0]+=Math.max(dp[v][0],dp[v][1]);dp[u][1]+=dp[v][0]}}
      dfs(1,0);return Math.max(dp[1][0],dp[1][1])
    }
    const gen1=()=>{const n=randInt(3,15);const edges:number[][]=[];for(let i=2;i<=n;i++)edges.push([randInt(1,i-1),i]);return{input:`${n}\n${edges.map(e=>e.join(' ')).join('\n')}`,output:`${mis(n,edges)}`,is_sample:false}}
    return [{input:'4\n1 2\n1 3\n3 4',output:'3',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '区间DP-石子合并',
  desc: `## 题目描述

$N$ 堆石子排成一行，每次合并相邻两堆，代价为两堆之和。求合并为一堆的最小代价。

## 输入格式

第一行 $N$。第二行 $N$ 个整数表示每堆石子数。

## 输出格式

一行，最小代价。

## 数据范围

$1 \\le N \\le 200$`,
  difficulty: 'hard', categories: ['dp_interval'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const solve=(a:number[])=>{
      const n=a.length;const pre=[0];for(const x of a)pre.push(pre[pre.length-1]+x)
      const dp=Array.from({length:n},()=>Array(n).fill(0))
      for(let len=2;len<=n;len++)for(let i=0;i+len<=n;i++){const j=i+len-1;dp[i][j]=Infinity;for(let k=i;k<j;k++)dp[i][j]=Math.min(dp[i][j],dp[i][k]+dp[k+1][j]+pre[j+1]-pre[i])}
      return dp[0][n-1]
    }
    const gen1=()=>{const n=randInt(3,10);const arr=Array.from({length:n},()=>randInt(1,20));return{input:`${n}\n${arr.join(' ')}`,output:`${solve(arr)}`,is_sample:false}}
    return [{input:'4\n1 3 5 2',output:'22',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '状态压缩DP-旅行商',
  desc: `## 题目描述

给定 $N$ 个城市的完全图，$dist[i][j]$ 为城市 $i$ 到 $j$ 的距离。从城市 $0$ 出发，经过所有城市恰好一次并回到起点，求最短路径。

## 输入格式

第一行 $N$。接下来 $N$ 行 $N$ 个整数，为距离矩阵。

## 输出格式

一行，最短路径长度。

## 数据范围

$2 \\le N \\le 15$`,
  difficulty: 'hard', categories: ['dp_state'], time_limit: 2000, memory_limit: 256,
  gen: () => {
    const tsp=(n:number,dist:number[][])=>{
      const dp=Array.from({length:1<<n},()=>Array(n).fill(Infinity));dp[1][0]=0
      for(let s=1;s<(1<<n);s++)for(let u=0;u<n;u++)if(dp[s][u]<Infinity)for(let v=0;v<n;v++)if(!(s&(1<<v)))dp[s|(1<<v)][v]=Math.min(dp[s|(1<<v)][v],dp[s][u]+dist[u][v])
      let ans=Infinity;for(let u=1;u<n;u++)ans=Math.min(ans,dp[(1<<n)-1][u]+dist[u][0]);return ans
    }
    const gen1=()=>{
      const n=randInt(3,6);const dist=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?0:randInt(1,20)))
      return{input:`${n}\n${dist.map(r=>r.join(' ')).join('\n')}`,output:`${tsp(n,dist)}`,is_sample:false}
    }
    return [{input:'3\n0 1 2\n1 0 3\n2 3 0',output:'6',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '数位DP-不含4的数',
  desc: `## 题目描述

给定 $L$ 和 $R$，求 $[L,R]$ 中不包含数字 $4$ 的整数个数。

## 输入格式

一行，两个正整数 $L, R$。

## 输出格式

一行，满足条件的整数个数。

## 数据范围

$1 \\le L \\le R \\le 10^{12}$`,
  difficulty: 'hard', categories: ['dp_digit'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const count=(n:number)=>{const s=n.toString();const dp=Array.from({length:s.length+1},()=>Array(2).fill(-1))
    const dfs=(i:number,tight:boolean,memo:boolean):number=>{if(i===s.length)return 1;const k=tight?1:0;if(memo&&dp[i][k]!==-1)return dp[i][k]
    const limit=tight?parseInt(s[i]):9;let c=0;for(let d=0;d<=limit;d++){if(d===4)continue;c+=dfs(i+1,tight&&d===limit,memo&&d<limit)}
    if(memo)dp[i][k]=c;return c}
    return dfs(0,true,true)}
    return [
      {input:'1 10',output:`${count(10)-count(0)}`,is_sample:true},{input:'1 100',output:`${count(100)-count(0)}`,is_sample:true},
    ...[[1,20],[1,50],[10,100],[100,1000],[1,1000],[50,500],[1,500],[10,200]].map(([l,r])=>({input:`${l} ${r}`,output:`${count(r)-count(l-1)}`,is_sample:false}))
    ]
  }
},
{
  title: '树状数组-单点修改区间求和',
  desc: `## 题目描述

给定数组 $a$，支持 $Q$ 次操作：\`1 i v\` 将 $a_i$ 加 $v$；\`2 l r\` 查询 $\\sum_{i=l}^{r} a_i$。

## 输入格式

第一行 $N, Q$。第二行 $N$ 个整数。接下来 $Q$ 行操作。

## 输出格式

对于查询操作，输出结果。

## 数据范围

$1 \\le N, Q \\le 10^5$`,
  difficulty: 'medium', categories: ['fenwick'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{const n=randInt(5,15),q=randInt(3,8);const a=randArr(n,1,20);const arr=[...a];const out:string[]=[];const ops:string[]=[]
    for(let i=0;i<q;i++){if(Math.random()>0.5){const idx=randInt(1,n),v=randInt(-5,10);ops.push(`1 ${idx} ${v}`);arr[idx-1]+=v}else{const l=randInt(1,n),r=randInt(l,n);ops.push(`2 ${l} ${r}`);out.push(`${arr.slice(l-1,r).reduce((s,x)=>s+x,0)}`)}}
    return{input:`${n} ${q}\n${a.join(' ')}\n${ops.join('\n')}`,output:out.join('\n')||'',is_sample:false}}
    return [{input:'5 3\n1 2 3 4 5\n2 1 5\n1 3 -1\n2 1 5',output:'15\n14',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: 'ST表-区间最小值',
  desc: `## 题目描述

给定 $N$ 个整数和 $Q$ 个查询，每个查询问区间 $[l,r]$ 的最小值。

## 输入格式

第一行 $N, Q$。第二行 $N$ 个整数。接下来 $Q$ 行 $l, r$。

## 输出格式

$Q$ 行，每行区间最小值。

## 数据范围

$1 \\le N, Q \\le 10^5$`,
  difficulty: 'medium', categories: ['sparse_table'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{const n=randInt(5,15),q=randInt(3,6);const arr=randArr(n,-20,30)
    const qs=Array.from({length:q},()=>{const l=randInt(1,n),r=randInt(l,n);return[l,r]})
    return{input:`${n} ${q}\n${arr.join(' ')}\n${qs.map(e=>e.join(' ')).join('\n')}`,output:qs.map(([l,r])=>`${Math.min(...arr.slice(l-1,r))}`).join('\n'),is_sample:false}}
    return [{input:'5 2\n3 1 4 1 5\n1 3\n2 5',output:'1\n1',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '平衡树-Treap基础',
  desc: `## 题目描述

维护一个有序集合，支持 $Q$ 次操作：\`insert x\` 插入，\`delete x\` 删除，\`rank x\` 查询 $x$ 的排名。

## 输入格式

第一行 $Q$。接下来 $Q$ 行操作。

## 输出格式

对于 \`rank\` 操作，输出排名。

## 数据范围

$1 \\le Q \\le 10^5$`,
  difficulty: 'hard', categories: ['balanced_tree'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const gen1=()=>{const q=randInt(4,10);const s=new Set<number>();const ops:string[]=[];const out:string[]=[]
    for(let i=0;i<q;i++){const x=randInt(1,20);const t=randInt(0,2)
    if(t===0){ops.push(`insert ${x}`);s.add(x)}else if(t===1){ops.push(`delete ${x}`);s.delete(x)}else{ops.push(`rank ${x}`);const sorted=[...s].sort((a,b)=>a-b);const idx=sorted.indexOf(x);out.push(idx===-1?'-1':`${idx+1}`)}}
    return{input:`${q}\n${ops.join('\n')}`,output:out.join('\n')||'',is_sample:false}}
    return [{input:'5\ninsert 5\ninsert 3\nrank 3\ninsert 5\nrank 5',output:'1\n2',is_sample:true},...Array.from({length:9},gen1)]
  }
},
{
  title: '树链剖分-路径查询',
  desc: `## 题目描述

给定一棵树，每个节点有一个权值。支持 $Q$ 次查询，每次查询节点 $u$ 到 $v$ 路径上的最大权值。

## 输入格式

第一行 $N, Q$。第二行 $N$ 个整数（节点权值）。接下来 $N-1$ 行树边。接下来 $Q$ 行 $u, v$。

## 输出格式

$Q$ 行，路径最大值。

## 数据范围

$2 \\le N \\le 1000$`,
  difficulty: 'hard', categories: ['hld'], time_limit: 1000, memory_limit: 256,
  gen: () => {
    const pathMax=(n:number,val:number[],edges:number[][],qs:number[][])=>{
      const adj=Array.from({length:n+1},()=>[] as number[]);for(const[u,v]of edges){adj[u].push(v);adj[v].push(u)}
      const parent=new Array(n+1).fill(0);const depth=new Array(n+1).fill(0)
      const dfs=(u:number,p:number,d:number)=>{parent[u]=p;depth[u]=d;for(const v of adj[u])if(v!==p)dfs(v,u,d+1)}
      dfs(1,0,0)
      const query=(u:number,v:number)=>{let mx=-Infinity;while(u!==v){if(depth[u]>depth[v]){mx=Math.max(mx,val[u-1]);u=parent[u]}else{mx=Math.max(mx,val[v-1]);v=parent[v]}}mx=Math.max(mx,val[u-1]);return mx}
      return qs.map(([u,v])=>query(u,v)).join('\n')
    }
    const gen1=()=>{
      const n=randInt(4,12);const val=Array.from({length:n},()=>randInt(1,50))
      const edges:number[][]=[];for(let i=2;i<=n;i++)edges.push([randInt(1,i-1),i])
      const q=randInt(2,5);const qs=Array.from({length:q},()=>[randInt(1,n),randInt(1,n)])
      return{input:`${n} ${q}\n${val.join(' ')}\n${edges.map(e=>e.join(' ')).join('\n')}\n${qs.map(e=>e.join(' ')).join('\n')}`,output:pathMax(n,val,edges,qs),is_sample:false}
    }
    return [{input:'4 2\n1 5 3 7\n1 2\n1 3\n3 4\n2 4\n1 4',output:'7\n7',is_sample:true},...Array.from({length:9},gen1)]
  }
},
]

async function main() {
  console.log(`准备导入 ${problems.length} 道题目...`)

  for (let i = 0; i < problems.length; i++) {
    const p = problems[i]
    const examples = p.gen().filter(tc => tc.is_sample).map(tc => ({ input: tc.input, output: tc.output }))

    const result = await query(
      `INSERT INTO problems (title, description, difficulty, category, categories, time_limit, memory_limit, examples)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [p.title, p.desc, p.difficulty, p.categories[0] || '', JSON.stringify(p.categories), p.time_limit, p.memory_limit, JSON.stringify(examples)]
    )

    const pid = result.rows[0].id
    const testCases = p.gen()

    for (const tc of testCases) {
      await query(
        'INSERT INTO test_cases (problem_id, input, output, is_sample) VALUES ($1, $2, $3, $4)',
        [pid, tc.input, tc.output, tc.is_sample]
      )
    }

    process.stdout.write(`\r[${i + 1}/${problems.length}] ${p.title} - ${testCases.length} test cases`)
  }

  console.log('\n\n导入完成！')

  const stats = await query('SELECT COUNT(*) as cnt FROM problems')
  const tcStats = await query('SELECT COUNT(*) as cnt FROM test_cases')
  console.log(`题目总数: ${stats.rows[0].cnt}`)
  console.log(`测试用例总数: ${tcStats.rows[0].cnt}`)

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
