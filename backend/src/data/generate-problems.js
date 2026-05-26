// 题目种子数据生成器
// 运行: node generate-problems.js

const fs = require('fs');
const path = require('path');

// ============ 题目定义模板 ============
// 每个标签10道题，每题10+测试用例

const allProblems = [];

function addProblem(title, desc, difficulty, category, categories, timeLimit, memLimit, examples) {
  allProblems.push({
    title, description: desc, difficulty, category, categories,
    time_limit: timeLimit || 1000, memory_limit: memLimit || 256, examples
  });
}

// ============ 语法基础 (8 tags × 10 = 80) ============

// --- io 输入输出 (10) ---
addProblem('A+B问题', '给定两个整数A和B，计算A+B的值。\n\n**输入格式**\n一行两个整数A和B。\n\n**输出格式**\n一个整数，A+B的值。', 'easy', '输入输出', ['io'], 1000, 256,
  [{input:'1 2',output:'3'},{input:'0 0',output:'0'},{input:'-1 1',output:'0'},{input:'100 200',output:'300'},{input:'-5 -3',output:'-8'},{input:'999999 1',output:'1000000'},{input:'-100 50',output:'-50'},{input:'2147483647 0',output:'2147483647'},{input:'1 -1',output:'0'},{input:'12345 67890',output:'80235'}]);

addProblem('A+B问题（多组数据）', '给定多组数据，每组包含两个整数A和B，计算每组的和。\n\n**输入格式**\n第一行一个整数T，表示数据组数。\n接下来T行，每行两个整数A和B。\n\n**输出格式**\n共T行，每行一个整数。', 'easy', '输入输出', ['io'], 1000, 256,
  [{input:'3\n1 2\n3 4\n5 6',output:'3\n7\n11'},{input:'1\n0 0',output:'0'},{input:'2\n-1 1\n100 -50',output:'0\n50'},{input:'5\n1 1\n2 2\n3 3\n4 4\n5 5',output:'2\n4\n6\n8\n10'},{input:'1\n999 1',output:'1000'},{input:'3\n-10 -20\n0 0\n10 20',output:'-30\n0\n30'},{input:'2\n1000000 2000000\n-5000000 3000000',output:'3000000\n-2000000'},{input:'4\n1 2\n3 4\n5 6\n7 8',output:'3\n7\n11\n15'},{input:'1\n-2147483648 2147483647',output:'-1'},{input:'3\n0 1\n1 0\n-1 -1',output:'1\n1\n-2'}]);

addProblem('输出字符三角形', '给定一个字符，用该字符输出一个高为3的等腰三角形。\n\n**输入格式**\n一个字符。\n\n**输出格式**\n用该字符组成的等腰三角形。', 'easy', '输入输出', ['io'], 1000, 256,
  [{input:'*',output:'  *\n * *\n*****'},{input:'#',output:'  #\n # #\n#####'},{input:'A',output:'  A\n A A\nAAAAA'},{input:'1',output:'  1\n 1 1\n11111'},{input:'@',output:'  @\n @ @\n@@@@@'},{input:'+',output:'  +\n + +\n+++++'},{input:'x',output:'  x\n x x\nxxxxx'},{input:'8',output:'  8\n 8 8\n88888'},{input:'O',output:'  O\n O O\nOOOOO'},{input:'.',output:'  .\n . .\n.....'}]);

addProblem('格式化输出乘法表', '输出n的乘法表前4行。\n\n**输入格式**\n一个整数n(1≤n≤9)。\n\n**输出格式**\n输出4行，格式为"n*i=结果"。', 'easy', '输入输出', ['io','loops'], 1000, 256,
  [{input:'2',output:'2*1=2\n2*2=4\n2*3=6\n2*4=8'},{input:'1',output:'1*1=1\n1*2=2\n1*3=3\n1*4=4'},{input:'3',output:'3*1=3\n3*2=6\n3*3=9\n3*4=12'},{input:'9',output:'9*1=9\n9*2=18\n9*3=27\n9*4=36'},{input:'5',output:'5*1=5\n5*2=10\n5*3=15\n5*4=20'},{input:'4',output:'4*1=4\n4*2=8\n4*3=12\n4*4=16'},{input:'6',output:'6*1=6\n6*2=12\n6*3=18\n6*4=24'},{input:'7',output:'7*1=7\n7*2=14\n7*3=21\n7*4=28'},{input:'8',output:'8*1=8\n8*2=16\n8*3=24\n8*4=32'},{input:'10',output:'10*1=10\n10*2=20\n10*3=30\n10*4=40'}]);

addProblem('读取到文件末尾', '不断读取整数并输出，直到输入结束。\n\n**输入格式**\n若干个整数，每行一个。\n\n**输出格式**\n逐行原样输出每个整数。', 'easy', '输入输出', ['io'], 1000, 256,
  [{input:'1\n2\n3',output:'1\n2\n3'},{input:'42',output:'42'},{input:'0',output:'0'},{input:'-1\n-2\n-3',output:'-1\n-2\n-3'},{input:'100\n200',output:'100\n200'},{input:'1\n10\n100\n1000',output:'1\n10\n100\n1000'},{input:'999',output:'999'},{input:'5\n4\n3\n2\n1',output:'5\n4\n3\n2\n1'},{input:'-2147483648',output:'-2147483648'},{input:'0\n0\n0',output:'0\n0\n0'}]);

addProblem('数字分离', '输入一个三位正整数，分离出它的百位、十位、个位。\n\n**输入格式**\n一个三位正整数。\n\n**输出格式**\n三个整数，分别为百位、十位、个位。', 'easy', '输入输出', ['io','variables'], 1000, 256,
  [{input:'123',output:'1 2 3'},{input:'100',output:'1 0 0'},{input:'999',output:'9 9 9'},{input:'506',output:'5 0 6'},{input:'210',output:'2 1 0'},{input:'111',output:'1 1 1'},{input:'456',output:'4 5 6'},{input:'789',output:'7 8 9'},{input:'200',output:'2 0 0'},{input:'102',output:'1 0 2'}]);

addProblem('浮点数格式化', '读入一个浮点数，保留2位小数输出，保留6位小数输出，保留12位小数输出。\n\n**输入格式**\n一个浮点数。\n\n**输出格式**\n三行，分别为保留2位、6位、12位小数的结果。', 'easy', '输入输出', ['io'], 1000, 256,
  [{input:'3.1415926535',output:'3.14\n3.141593\n3.141592653500'},{input:'1.0',output:'1.00\n1.000000\n1.000000000000'},{input:'0.5',output:'0.50\n0.500000\n0.500000000000'},{input:'2.718',output:'2.72\n2.718000\n2.718000000000'},{input:'0.0',output:'0.00\n0.000000\n0.000000000000'},{input:'100.999',output:'101.00\n100.999000\n100.999000000000'},{input:'1.2345',output:'1.23\n1.234500\n1.234500000000'},{input:'9.87654321',output:'9.88\n9.876543\n9.876543210000'},{input:'0.1',output:'0.10\n0.100000\n0.100000000000'},{input:'3.0',output:'3.00\n3.000000\n3.000000000000'}]);

addProblem('字符串输入输出', '读入一行字符串（含空格），原样输出。\n\n**输入格式**\n一行字符串（含空格，长度不超过100）。\n\n**输出格式**\n原样输出该字符串。', 'easy', '输入输出', ['io','strings'], 1000, 256,
  [{input:'Hello World',output:'Hello World'},{input:'A',output:'A'},{input:'  leading spaces',output:'  leading spaces'},{input:'trailing spaces  ',output:'trailing spaces  '},{input:'  both  ',output:'  both  '},{input:'multiple   spaces',output:'multiple   spaces'},{input:'Hello, World!',output:'Hello, World!'},{input:'123 456 789',output:'123 456 789'},{input:'a b c d e',output:'a b c d e'},{input:'Test String 123!',output:'Test String 123!'}]);

addProblem('多行输入求和', '第一行输入n，接下来n行每行一个整数，求它们的和。\n\n**输入格式**\n第一行整数n，接下来n行每行一个整数。\n\n**输出格式**\n一个整数，所有数的和。', 'easy', '输入输出', ['io','loops'], 1000, 256,
  [{input:'3\n1\n2\n3',output:'6'},{input:'1\n5',output:'5'},{input:'5\n-1\n-2\n-3\n-4\n-5',output:'-15'},{input:'0',output:'0'},{input:'4\n10\n20\n30\n40',output:'100'},{input:'2\n100\n-100',output:'0'},{input:'3\n0\n0\n0',output:'0'},{input:'6\n1\n2\n3\n4\n5\n6',output:'21'},{input:'1\n0',output:'0'},{input:'3\n999\n1\n-500',output:'500'}]);

addProblem('字符的ASCII码', '输入一个字符，输出它的ASCII码值。\n\n**输入格式**\n一个字符。\n\n**输出格式**\n一个整数，该字符的ASCII码。', 'easy', '输入输出', ['io','variables'], 1000, 256,
  [{input:'A',output:'65'},{input:'a',output:'97'},{input:'0',output:'48'},{input:'Z',output:'90'},{input:'z',output:'122'},{input:' ',output:'32'},{input:'!',output:'33'},{input:'~',output:'126'},{input:'9',output:'57'},{input:'#',output:'35'}]);

// --- variables 变量与数据类型 (10) ---
addProblem('整型变量交换', '给定两个整数a和b，交换它们的值并输出。\n\n**输入格式**\n两个整数a和b。\n\n**输出格式**\n交换后的两个整数，空格分隔。', 'easy', '变量与类型', ['variables'], 1000, 256,
  [{input:'1 2',output:'2 1'},{input:'0 0',output:'0 0'},{input:'-1 1',output:'1 -1'},{input:'100 200',output:'200 100'},{input:'999 1',output:'1 999'},{input:'-5 -3',output:'-3 -5'},{input:'42 0',output:'0 42'},{input:'1 1000000',output:'1000000 1'},{input:'123 456',output:'456 123'},{input:'-100 -200',output:'-200 -100'}]);

addProblem('计算圆的面积', '给定圆的半径r，计算圆的面积（π=3.14159）。\n\n**输入格式**\n一个浮点数r。\n\n**输出格式**\n圆的面积，保留4位小数。', 'easy', '变量与类型', ['variables'], 1000, 256,
  [{input:'1',output:'3.1416'},{input:'2',output:'12.5664'},{input:'0',output:'0.0000'},{input:'0.5',output:'0.7854'},{input:'3',output:'28.2743'},{input:'10',output:'314.1590'},{input:'1.5',output:'7.0686'},{input:'0.1',output:'0.0314'},{input:'100',output:'31415.9000'},{input:'5',output:'78.5398'}]);

addProblem('数据类型大小', '分别输出int、long long、float、double的字节数。\n\n**输入格式**\n无输入。\n\n**输出格式**\n一行四个整数，分别为int、long long、float、double的字节数。', 'easy', '变量与类型', ['variables'], 1000, 256,
  [{input:'',output:'4 8 4 8'},{input:'',output:'4 8 4 8'},{input:'',output:'4 8 4 8'},{input:'',output:'4 8 4 8'},{input:'',output:'4 8 4 8'},{input:'',output:'4 8 4 8'},{input:'',output:'4 8 4 8'},{input:'',output:'4 8 4 8'},{input:'',output:'4 8 4 8'},{input:'',output:'4 8 4 8'}]);

addProblem('温度转换', '输入华氏温度F，转换为摄氏温度C并输出。公式：C=5*(F-32)/9。\n\n**输入格式**\n一个浮点数F。\n\n**输出格式**\n摄氏温度，保留2位小数。', 'easy', '变量与类型', ['variables'], 1000, 256,
  [{input:'32',output:'0.00'},{input:'212',output:'100.00'},{input:'100',output:'37.78'},{input:'0',output:'-17.78'},{input:'50',output:'10.00'},{input:'98.6',output:'37.00'},{input:'-40',output:'-40.00'},{input:'72',output:'22.22'},{input:'200',output:'93.33'},{input:'68',output:'20.00'}]);

addProblem('整数绝对值', '输入一个整数，输出它的绝对值。\n\n**输入格式**\n一个整数n。\n\n**输出格式**\nn的绝对值。', 'easy', '变量与类型', ['variables','control'], 1000, 256,
  [{input:'5',output:'5'},{input:'-5',output:'5'},{input:'0',output:'0'},{input:'-1',output:'1'},{input:'1',output:'1'},{input:'-100',output:'100'},{input:'2147483647',output:'2147483647'},{input:'-999',output:'999'},{input:'12345',output:'12345'},{input:'-12345',output:'12345'}]);

addProblem('计算三角形面积', '给定三角形的底a和高h，计算面积。\n\n**输入格式**\n两个浮点数a和h。\n\n**输出格式**\n三角形面积，保留2位小数。', 'easy', '变量与类型', ['variables'], 1000, 256,
  [{input:'3 4',output:'6.00'},{input:'1 1',output:'0.50'},{input:'10 5',output:'25.00'},{input:'0 5',output:'0.00'},{input:'5 0',output:'0.00'},{input:'2.5 4',output:'5.00'},{input:'7 3',output:'10.50'},{input:'100 1',output:'50.00'},{input:'1.5 2.5',output:'1.88'},{input:'6 8',output:'24.00'}]);

addProblem('秒数转换', '输入一个总秒数，转换为"X小时Y分Z秒"的格式。\n\n**输入格式**\n一个非负整数n（总秒数）。\n\n**输出格式**\n"X小时Y分Z秒"。', 'easy', '变量与类型', ['variables','loops'], 1000, 256,
  [{input:'0',output:'0小时0分0秒'},{input:'1',output:'0小时0分1秒'},{input:'60',output:'0小时1分0秒'},{input:'3600',output:'1小时0分0秒'},{input:'3661',output:'1小时1分1秒'},{input:'86400',output:'24小时0分0秒'},{input:'45',output:'0小时0分45秒'},{input:'90',output:'0小时1分30秒'},{input:'7384',output:'2小时3分4秒'},{input:'36000',output:'10小时0分0秒'}]);

addProblem('求商和余数', '输入两个正整数a和b，求a÷b的商和余数。\n\n**输入格式**\n两个正整数a和b。\n\n**输出格式**\n商和余数，空格分隔。', 'easy', '变量与类型', ['variables'], 1000, 256,
  [{input:'7 3',output:'2 1'},{input:'10 2',output:'5 0'},{input:'1 1',output:'1 0'},{input:'100 7',output:'14 2'},{input:'999 10',output:'99 9'},{input:'0 5',output:'0 0'},{input:'50 8',output:'6 2'},{input:'17 5',output:'3 2'},{input:'256 16',output:'16 0'},{input:'12345 100',output:'123 45'}]);

addProblem('计算平均值', '输入三个整数，计算它们的平均值（保留2位小数）。\n\n**输入格式**\n三个整数，空格分隔。\n\n**输出格式**\n平均值，保留2位小数。', 'easy', '变量与类型', ['variables'], 1000, 256,
  [{input:'1 2 3',output:'2.00'},{input:'0 0 0',output:'0.00'},{input:'100 200 300',output:'200.00'},{input:'-1 0 1',output:'0.00'},{input:'1 1 1',output:'1.00'},{input:'10 20 30',output:'20.00'},{input:'-5 -10 -15',output:'-10.00'},{input:'1 2 4',output:'2.33'},{input:'99 100 101',output:'100.00'},{input:'7 13 20',output:'13.33'}]);

addProblem('ASCII码转字符', '输入一个整数（0~127），输出对应的ASCII字符。\n\n**输入格式**\n一个整数。\n\n**输出格式**\n对应的ASCII字符。', 'easy', '变量与类型', ['variables','io'], 1000, 256,
  [{input:'65',output:'A'},{input:'97',output:'a'},{input:'48',output:'0'},{input:'90',output:'Z'},{input:'122',output:'z'},{input:'32',output:' '},{input:'33',output:'!'},{input:'57',output:'9'},{input:'66',output:'B'},{input:'10',output:'\n'}]);

// --- control 控制语句 (10) ---
addProblem('判断奇偶', '输入一个整数，判断是奇数还是偶数。\n\n**输入格式**\n一个整数n。\n\n**输出格式**\n奇数输出"odd"，偶数输出"even"。', 'easy', '控制语句', ['control'], 1000, 256,
  [{input:'1',output:'odd'},{input:'2',output:'even'},{input:'0',output:'even'},{input:'-1',output:'odd'},{input:'-2',output:'even'},{input:'100',output:'even'},{input:'99',output:'odd'},{input:'12345',output:'odd'},{input:'12344',output:'even'},{input:'2147483647',output:'odd'}]);

addProblem('比较大小', '输入两个整数a和b，输出较大的那个。\n\n**输入格式**\n两个整数。\n\n**输出格式**\n较大的整数。相等时输出任意一个。', 'easy', '控制语句', ['control'], 1000, 256,
  [{input:'1 2',output:'2'},{input:'5 3',output:'5'},{input:'0 0',output:'0'},{input:'-1 1',output:'1'},{input:'-5 -3',output:'-3'},{input:'100 200',output:'200'},{input:'0 -1',output:'0'},{input:'999 1000',output:'1000'},{input:'42 42',output:'42'},{input:'-100 -99',output:'-99'}]);

addProblem('成绩等级', '输入一个成绩（0~100），输出等级：90~100为A，80~89为B，70~79为C，60~69为D，60以下为E。\n\n**输入格式**\n一个整数。\n\n**输出格式**\n等级字母。', 'easy', '控制语句', ['control'], 1000, 256,
  [{input:'95',output:'A'},{input:'85',output:'B'},{input:'75',output:'C'},{input:'65',output:'D'},{input:'55',output:'E'},{input:'100',output:'A'},{input:'90',output:'A'},{input:'80',output:'B'},{input:'70',output:'C'},{input:'60',output:'D'}]);

addProblem('闰年判断', '判断某年是否为闰年。闰年条件：能被4整除但不能被100整除，或能被400整除。\n\n**输入格式**\n一个整数year。\n\n**输出格式**\n是闰年输出"Yes"，否则输出"No"。', 'easy', '控制语句', ['control'], 1000, 256,
  [{input:'2000',output:'Yes'},{input:'1900',output:'No'},{input:'2004',output:'Yes'},{input:'2001',output:'No'},{input:'2024',output:'Yes'},{input:'2100',output:'No'},{input:'2400',output:'Yes'},{input:'1996',output:'Yes'},{input:'1999',output:'No'},{input:'2020',output:'Yes'}]);

addProblem('三个数排序', '输入三个整数，按从小到大输出。\n\n**输入格式**\n三个整数。\n\n**输出格式**\n排序后的三个整数。', 'easy', '控制语句', ['control'], 1000, 256,
  [{input:'3 1 2',output:'1 2 3'},{input:'1 2 3',output:'1 2 3'},{input:'3 2 1',output:'1 2 3'},{input:'0 0 0',output:'0 0 0'},{input:'-1 -3 -2',output:'-3 -2 -1'},{input:'1 1 2',output:'1 1 2'},{input:'100 50 75',output:'50 75 100'},{input:'5 5 5',output:'5 5 5'},{input:'0 -1 1',output:'-1 0 1'},{input:'10 -10 0',output:'-10 0 10'}]);

addProblem('判断三角形', '给定三条边a、b、c，判断能否构成三角形。\n\n**输入格式**\n三个正整数。\n\n**输出格式**\n能构成输出"Yes"，否则输出"No"。', 'easy', '控制语句', ['control'], 1000, 256,
  [{input:'3 4 5',output:'Yes'},{input:'1 1 1',output:'Yes'},{input:'1 2 3',output:'No'},{input:'5 5 5',output:'Yes'},{input:'1 1 3',output:'No'},{input:'10 6 8',output:'Yes'},{input:'1 2 4',output:'No'},{input:'7 10 5',output:'Yes'},{input:'2 3 10',output:'No'},{input:'100 100 1',output:'Yes'}]);

addProblem('星期几', '已知今天星期几（0=周日，1=周一...6=周六），求n天后是星期几。\n\n**输入格式**\n两个整数，今天的星期几和n天后的n。\n\n**输出格式**\nn天后的星期几（0~6）。', 'easy', '控制语句', ['control'], 1000, 256,
  [{input:'1 1',output:'2'},{input:'0 7',output:'0'},{input:'6 1',output:'0'},{input:'5 10',output:'1'},{input:'3 100',output:'5'},{input:'0 0',output:'0'},{input:'1 6',output:'0'},{input:'2 14',output:'2'},{input:'4 365',output:'3'},{input:'6 365',output:'5'}]);

addProblem('简单计算器', '输入两个整数和一个运算符(+,-,*,/)，输出计算结果。除法保留2位小数。\n\n**输入格式**\n两个整数和一个字符。\n\n**输出格式**\n计算结果。', 'easy', '控制语句', ['control','variables'], 1000, 256,
  [{input:'1 + 2',output:'3'},{input:'5 - 3',output:'2'},{input:'3 * 4',output:'12'},{input:'10 / 3',output:'3.33'},{input:'0 + 0',output:'0'},{input:'100 - 50',output:'50'},{input:'7 * 8',output:'56'},{input:'1 / 2',output:'0.50'},{input:'-5 + 3',output:'-2'},{input:'99 * 99',output:'9801'}]);

addProblem('分段函数', '计算分段函数y的值：\n- x<0: y = -x\n- 0<=x<10: y = x*x\n- x>=10: y = 3*x-2\n\n**输入格式**\n一个整数x。\n\n**输出格式**\ny的值。', 'easy', '控制语句', ['control'], 1000, 256,
  [{input:'-5',output:'5'},{input:'0',output:'0'},{input:'5',output:'25'},{input:'10',output:'28'},{input:'1',output:'1'},{input:'-1',output:'1'},{input:'3',output:'9'},{input:'9',output:'81'},{input:'100',output:'298'},{input:'-100',output:'100'}]);

addProblem('判断正负零', '输入一个整数，判断它是正数、负数还是零。\n\n**输入格式**\n一个整数n。\n\n**输出格式**\n正数输出"positive"，负数输出"negative"，零输出"zero"。', 'easy', '控制语句', ['control'], 1000, 256,
  [{input:'1',output:'positive'},{input:'-1',output:'negative'},{input:'0',output:'zero'},{input:'100',output:'positive'},{input:'-100',output:'negative'},{input:'999',output:'positive'},{input:'-999',output:'negative'},{input:'2147483647',output:'positive'},{input:'-2147483648',output:'negative'},{input:'42',output:'positive'}]);

// --- loops 循环语句 (10) ---
addProblem('求1到N的和', '输入正整数N，求1+2+...+N的和。\n\n**输入格式**\n一个正整数N。\n\n**输出格式**\n一个整数，1到N的和。', 'easy', '循环语句', ['loops'], 1000, 256,
  [{input:'1',output:'1'},{input:'10',output:'55'},{input:'100',output:'5050'},{input:'2',output:'3'},{input:'0',output:'0'},{input:'50',output:'1275'},{input:'1000',output:'500500'},{input:'5',output:'15'},{input:'999',output:'498500'},{input:'10000',output:'50005000'}]);

addProblem('求阶乘', '输入非负整数N，求N的阶乘。\n\n**输入格式**\n一个非负整数N(N<=20)。\n\n**输出格式**\nN的阶乘。', 'easy', '循环语句', ['loops','recursion'], 1000, 256,
  [{input:'0',output:'1'},{input:'1',output:'1'},{input:'5',output:'120'},{input:'10',output:'3628800'},{input:'2',output:'2'},{input:'3',output:'6'},{input:'4',output:'24'},{input:'6',output:'720'},{input:'8',output:'40320'},{input:'20',output:'2432902008176640000'}]);

addProblem('求N个数的最大值', '输入N个整数，求最大值。\n\n**输入格式**\n第一行N，第二行N个整数。\n\n**输出格式**\n最大值。', 'easy', '循环语句', ['loops','arrays'], 1000, 256,
  [{input:'3\n1 2 3',output:'3'},{input:'5\n-1 -2 -3 -4 -5',output:'-1'},{input:'1\n42',output:'42'},{input:'4\n10 20 30 40',output:'40'},{input:'3\n0 0 0',output:'0'},{input:'2\n-100 100',output:'100'},{input:'6\n1 5 3 2 4 6',output:'6'},{input:'3\n999 -1 500',output:'999'},{input:'5\n1 1 1 1 1',output:'1'},{input:'4\n-50 -30 -20 -40',output:'-20'}]);

addProblem('打印星号三角形', '输入N，输出N行星号三角形。\n\n**输入格式**\n一个正整数N。\n\n**输出格式**\nN行星号三角形，第i行有i个*。', 'easy', '循环语句', ['loops','io'], 1000, 256,
  [{input:'3',output:'*\n**\n***'},{input:'1',output:'*'},{input:'5',output:'*\n**\n***\n****\n*****'},{input:'2',output:'*\n**'},{input:'4',output:'*\n**\n***\n****'},{input:'6',output:'*\n**\n***\n****\n*****\n******'},{input:'7',output:'*\n**\n***\n****\n*****\n******\n*******'},{input:'8',output:'*\n**\n***\n****\n*****\n******\n*******\n********'},{input:'9',output:'*\n**\n***\n****\n*****\n******\n*******\n********\n*********'},{input:'10',output:'*\n**\n***\n****\n*****\n******\n*******\n********\n*********\n**********'}]);

addProblem('统计数字', '输入一个正整数N，统计1到N中有多少个能被3或5整除的数。\n\n**输入格式**\n一个正整数N。\n\n**输出格式**\n满足条件的数的个数。', 'easy', '循环语句', ['loops'], 1000, 256,
  [{input:'1',output:'0'},{input:'3',output:'1'},{input:'5',output:'2'},{input:'15',output:'7'},{input:'10',output:'5'},{input:'20',output:'9'},{input:'30',output:'14'},{input:'100',output:'47'},{input:'0',output:'0'},{input:'50',output:'23'}]);

addProblem('求e的近似值', '利用公式e=1+1/1!+1/2!+1/3!+...+1/n!求e的近似值。\n\n**输入格式**\n一个整数n。\n\n**输出格式**\ne的近似值，保留6位小数。', 'medium', '循环语句', ['loops'], 1000, 256,
  [{input:'1',output:'2.000000'},{input:'2',output:'2.500000'},{input:'5',output:'2.716667'},{input:'10',output:'2.718282'},{input:'3',output:'2.666667'},{input:'4',output:'2.708333'},{input:'0',output:'1.000000'},{input:'6',output:'2.718056'},{input:'8',output:'2.718279'},{input:'20',output:'2.718282'}]);

addProblem('九九乘法表', '输出九九乘法表。\n\n**输入格式**\n无输入。\n\n**输出格式**\n九九乘法表，每行格式为"i*j=result"，用空格分隔。', 'easy', '循环语句', ['loops'], 1000, 256,
  [{input:'',output:'1*1=1 \n1*2=2 2*2=4 \n1*3=3 2*3=6 3*3=9 \n1*4=4 2*4=8 3*4=12 4*4=16 \n1*5=5 2*5=10 3*5=15 4*5=20 5*5=25 \n1*6=6 2*6=12 3*6=18 4*6=24 5*6=30 6*6=36 \n1*7=7 2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49 \n1*8=8 2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64 \n1*9=9 2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81 '},{input:'x',output:'1*1=1 \n1*2=2 2*2=4 \n1*3=3 2*3=6 3*3=9 \n1*4=4 2*4=8 3*4=12 4*4=16 \n1*5=5 2*5=10 3*5=15 4*5=20 5*5=25 \n1*6=6 2*6=12 3*6=18 4*6=24 5*6=30 6*6=36 \n1*7=7 2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49 \n1*8=8 2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64 \n1*9=9 2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81 '},{input:'',output:'1*1=1 \n1*2=2 2*2=4 \n1*3=3 2*3=6 3*3=9 \n1*4=4 2*4=8 3*4=12 4*4=16 \n1*5=5 2*5=10 3*5=15 4*5=20 5*5=25 \n1*6=6 2*6=12 3*6=18 4*6=24 5*6=30 6*6=36 \n1*7=7 2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49 \n1*8=8 2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64 \n1*9=9 2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81 '},{input:'',output:'1*1=1 \n1*2=2 2*2=4 \n1*3=3 2*3=6 3*3=9 \n1*4=4 2*4=8 3*4=12 4*4=16 \n1*5=5 2*5=10 3*5=15 4*5=20 5*5=25 \n1*6=6 2*6=12 3*6=18 4*6=24 5*6=30 6*6=36 \n1*7=7 2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49 \n1*8=8 2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64 \n1*9=9 2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81 '},{input:'',output:'1*1=1 \n1*2=2 2*2=4 \n1*3=3 2*3=6 3*3=9 \n1*4=4 2*4=8 3*4=12 4*4=16 \n1*5=5 2*5=10 3*5=15 4*5=20 5*5=25 \n1*6=6 2*6=12 3*6=18 4*6=24 5*6=30 6*6=36 \n1*7=7 2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49 \n1*8=8 2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64 \n1*9=9 2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81 '},{input:'',output:'1*1=1 \n1*2=2 2*2=4 \n1*3=3 2*3=6 3*3=9 \n1*4=4 2*4=8 3*4=12 4*4=16 \n1*5=5 2*5=10 3*5=15 4*5=20 5*5=25 \n1*6=6 2*6=12 3*6=18 4*6=24 5*6=30 6*6=36 \n1*7=7 2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49 \n1*8=8 2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64 \n1*9=9 2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81 '},{input:'',output:'1*1=1 \n1*2=2 2*2=4 \n1*3=3 2*3=6 3*3=9 \n1*4=4 2*4=8 3*4=12 4*4=16 \n1*5=5 2*5=10 3*5=15 4*5=20 5*5=25 \n1*6=6 2*6=12 3*6=18 4*6=24 5*6=30 6*6=36 \n1*7=7 2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49 \n1*8=8 2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64 \n1*9=9 2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81 '},{input:'',output:'1*1=1 \n1*2=2 2*2=4 \n1*3=3 2*3=6 3*3=9 \n1*4=4 2*4=8 3*4=12 4*4=16 \n1*5=5 2*5=10 3*5=15 4*5=20 5*5=25 \n1*6=6 2*6=12 3*6=18 4*6=24 5*6=30 6*6=36 \n1*7=7 2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49 \n1*8=8 2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64 \n1*9=9 2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81 '},{input:'',output:'1*1=1 \n1*2=2 2*2=4 \n1*3=3 2*3=6 3*3=9 \n1*4=4 2*4=8 3*4=12 4*4=16 \n1*5=5 2*5=10 3*5=15 4*5=20 5*5=25 \n1*6=6 2*6=12 3*6=18 4*6=24 5*6=30 6*6=36 \n1*7=7 2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49 \n1*8=8 2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64 \n1*9=9 2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81 '}]);

addProblem('水仙花数', '判断一个三位数是否为水仙花数（各位数字的立方和等于该数本身）。\n\n**输入格式**\n一个三位整数N。\n\n**输出格式**\n是输出"Yes"，否输出"No"。', 'easy', '循环语句', ['loops','control'], 1000, 256,
  [{input:'153',output:'Yes'},{input:'370',output:'Yes'},{input:'371',output:'Yes'},{input:'407',output:'Yes'},{input:'100',output:'No'},{input:'200',output:'No'},{input:'999',output:'No'},{input:'123',output:'No'},{input:'111',output:'No'},{input:'555',output:'No'}]);

addProblem('最小公倍数', '求两个正整数a和b的最小公倍数。\n\n**输入格式**\n两个正整数a和b。\n\n**输出格式**\n最小公倍数。', 'easy', '循环语句', ['loops','number_theory'], 1000, 256,
  [{input:'12 18',output:'36'},{input:'3 5',output:'15'},{input:'4 6',output:'12'},{input:'1 1',output:'1'},{input:'7 13',output:'91'},{input:'10 25',output:'50'},{input:'6 8',output:'24'},{input:'100 75',output:'300'},{input:'2 3',output:'6'},{input:'9 12',output:'36'}]);

addProblem('斐波那契数列前N项', '输出斐波那契数列前N项。\n\n**输入格式**\n一个正整数N(N<=40)。\n\n**输出格式**\n斐波那契数列前N项，空格分隔。', 'easy', '循环语句', ['loops','recursion'], 1000, 256,
  [{input:'1',output:'1'},{input:'2',output:'1 1'},{input:'5',output:'1 1 2 3 5'},{input:'10',output:'1 1 2 3 5 8 13 21 34 55'},{input:'3',output:'1 1 2'},{input:'4',output:'1 1 2 3'},{input:'6',output:'1 1 2 3 5 8'},{input:'7',output:'1 1 2 3 5 8 13'},{input:'8',output:'1 1 2 3 5 8 13 21'},{input:'20',output:'1 1 2 3 5 8 13 21 34 55 89 144 233 377 610 987 1597 2584 4181 6765'}]);

// --- arrays 数组操作 (10) ---
addProblem('数组求和', '输入N个整数，求它们的和。\n\n**输入格式**\n第一行N，第二行N个整数。\n\n**输出格式**\n它们的和。', 'easy', '数组操作', ['arrays','loops'], 1000, 256,
  [{input:'5\n1 2 3 4 5',output:'15'},{input:'1\n100',output:'100'},{input:'3\n-1 0 1',output:'0'},{input:'4\n10 20 30 40',output:'100'},{input:'2\n-5 -3',output:'-8'},{input:'1\n0',output:'0'},{input:'6\n1 1 1 1 1 1',output:'6'},{input:'3\n100 200 300',output:'600'},{input:'5\n-10 5 -3 8 0',output:'0'},{input:'10\n1 2 3 4 5 6 7 8 9 10',output:'55'}]);

addProblem('数组逆序', '将数组逆序输出。\n\n**输入格式**\n第一行N，第二行N个整数。\n\n**输出格式**\n逆序后的数组。', 'easy', '数组操作', ['arrays'], 1000, 256,
  [{input:'5\n1 2 3 4 5',output:'5 4 3 2 1'},{input:'1\n42',output:'42'},{input:'3\n10 20 30',output:'30 20 10'},{input:'2\n1 2',output:'2 1'},{input:'4\n-1 -2 -3 -4',output:'-4 -3 -2 -1'},{input:'6\n1 1 1 1 1 1',output:'1 1 1 1 1 1'},{input:'3\n0 0 0',output:'0 0 0'},{input:'5\n5 4 3 2 1',output:'1 2 3 4 5'},{input:'2\n100 -100',output:'-100 100'},{input:'7\n1 2 3 4 5 6 7',output:'7 6 5 4 3 2 1'}]);

addProblem('数组去重', '将数组中重复的元素去掉，保持原有顺序，输出去重后的数组。\n\n**输入格式**\n第一行N，第二行N个整数。\n\n**输出格式**\n去重后的数组。', 'medium', '数组操作', ['arrays'], 1000, 256,
  [{input:'5\n1 2 3 2 1',output:'1 2 3'},{input:'5\n1 1 1 1 1',output:'1'},{input:'5\n1 2 3 4 5',output:'1 2 3 4 5'},{input:'1\n42',output:'42'},{input:'6\n3 1 2 1 3 2',output:'3 1 2'},{input:'4\n1 2 1 2',output:'1 2'},{input:'7\n5 3 5 3 5 3 5',output:'5 3'},{input:'3\n1 1 2',output:'1 2'},{input:'8\n1 2 3 1 2 3 4 4',output:'1 2 3 4'},{input:'4\n10 20 30 10',output:'10 20 30'}]);

addProblem('查找元素', '在数组中查找指定元素，输出其位置（从1开始），不存在输出-1。\n\n**输入格式**\n第一行N，第二行N个整数，第三行待查找的数x。\n\n**输出格式**\n位置（1-based），不存在输出-1。', 'easy', '数组操作', ['arrays'], 1000, 256,
  [{input:'5\n1 3 5 7 9\n5',output:'3'},{input:'5\n1 3 5 7 9\n2',output:'-1'},{input:'1\n42\n42',output:'1'},{input:'3\n10 20 30\n10',output:'1'},{input:'4\n1 2 3 4\n4',output:'4'},{input:'3\n5 5 5\n5',output:'1'},{input:'6\n1 2 3 4 5 6\n1',output:'1'},{input:'2\n100 200\n200',output:'2'},{input:'5\n-1 -2 -3 -4 -5\n-3',output:'3'},{input:'4\n0 0 0 0\n1',output:'-1'}]);

addProblem('数组中奇偶分离', '将数组中的奇数放前面，偶数放后面，保持相对顺序。\n\n**输入格式**\n第一行N，第二行N个整数。\n\n**输出格式**\n分离后的数组。', 'easy', '数组操作', ['arrays','control'], 1000, 256,
  [{input:'5\n1 2 3 4 5',output:'1 3 5 2 4'},{input:'4\n2 4 6 8',output:'2 4 6 8'},{input:'3\n1 3 5',output:'1 3 5'},{input:'6\n1 2 3 4 5 6',output:'1 3 5 2 4 6'},{input:'1\n42',output:'42'},{input:'4\n2 1 4 3',output:'1 3 2 4'},{input:'5\n0 1 0 1 0',output:'1 1 0 0 0'},{input:'2\n2 1',output:'1 2'},{input:'3\n3 6 9',output:'3 9 6'},{input:'5\n10 7 8 3 2',output:'7 3 10 8 2'}]);

addProblem('二维数组转置', '输入一个N×N矩阵，输出其转置矩阵。\n\n**输入格式**\n第一行N，接下来N行每行N个整数。\n\n**输出格式**\n转置矩阵。', 'medium', '数组操作', ['arrays'], 1000, 256,
  [{input:'2\n1 2\n3 4',output:'1 3\n2 4'},{input:'1\n5',output:'5'},{input:'3\n1 2 3\n4 5 6\n7 8 9',output:'1 4 7\n2 5 8\n3 6 9'},{input:'2\n0 0\n0 0',output:'0 0\n0 0'},{input:'3\n1 0 0\n0 1 0\n0 0 1',output:'1 0 0\n0 1 0\n0 0 1'},{input:'2\n10 20\n30 40',output:'10 30\n20 40'},{input:'3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9',output:'-1 -4 -7\n-2 -5 -8\n-3 -6 -9'},{input:'2\n1 0\n0 1',output:'1 0\n0 1'},{input:'3\n1 1 1\n2 2 2\n3 3 3',output:'1 2 3\n1 2 3\n1 2 3'},{input:'2\n100 200\n300 400',output:'100 300\n200 400'}]);

addProblem('矩阵加法', '输入两个N×M矩阵，输出它们的和。\n\n**输入格式**\n第一行N和M，接下来N×M个元素为第一个矩阵，再N×M个元素为第二个矩阵。\n\n**输出格式**\n矩阵之和。', 'easy', '数组操作', ['arrays'], 1000, 256,
  [{input:'2 2\n1 2\n3 4\n5 6\n7 8',output:'6 8\n10 12'},{input:'1 1\n1\n2',output:'3'},{input:'2 3\n1 2 3\n4 5 6\n0 0 0\n0 0 0',output:'1 2 3\n4 5 6'},{input:'1 3\n1 2 3\n-1 -2 -3',output:'0 0 0'},{input:'2 2\n0 0\n0 0\n0 0\n0 0',output:'0 0\n0 0'},{input:'1 2\n10 20\n30 40',output:'40 60'},{input:'3 1\n1\n2\n3\n-1\n-2\n-3',output:'0\n0\n0'},{input:'2 2\n-1 -2\n-3 -4\n1 2\n3 4',output:'0 0\n0 0'},{input:'1 4\n1 2 3 4\n4 3 2 1',output:'5 5 5 5'},{input:'2 1\n5\n10\n3\n7',output:'8\n17'}]);

addProblem('统计字符频率', '输入一个字符串，统计每个字母出现的次数（不区分大小写）。\n\n**输入格式**\n一行字符串。\n\n**输出格式**\n出现过的字母及其次数，按字母顺序排列。', 'medium', '数组操作', ['arrays','strings'], 1000, 256,
  [{input:'abc',output:'a:1 b:1 c:1'},{input:'aaa',output:'a:3'},{input:'hello',output:'e:1 h:1 l:2 o:1'},{input:'AaBb',output:'a:2 b:2'},{input:'xyz',output:'x:1 y:1 z:1'},{input:'a',output:'a:1'},{input:'ababab',output:'a:3 b:3'},{input:'Hello World',output:'d:1 e:1 h:1 l:3 o:2 r:1 w:1'},{input:'ABCabc',output:'a:2 b:2 c:2'},{input:'mississippi',output:'i:4 m:1 p:2 s:4'}]);

addProblem('前缀和数组', '给定一个数组，求其前缀和数组。前缀和S[i] = A[1]+A[2]+...+A[i]。\n\n**输入格式**\n第一行N，第二行N个整数。\n\n**输出格式**\n前缀和数组。', 'easy', '数组操作', ['arrays'], 1000, 256,
  [{input:'5\n1 2 3 4 5',output:'1 3 6 10 15'},{input:'1\n10',output:'10'},{input:'3\n-1 2 -3',output:'-1 1 -2'},{input:'4\n0 0 0 0',output:'0 0 0 0'},{input:'2\n5 -5',output:'5 0'},{input:'6\n1 1 1 1 1 1',output:'1 2 3 4 5 6'},{input:'3\n100 200 300',output:'100 300 600'},{input:'5\n10 -3 5 -2 8',output:'10 7 12 10 18'},{input:'4\n-10 -20 -30 -40',output:'-10 -30 -60 -100'},{input:'2\n0 100',output:'0 100'}]);

addProblem('数组排序验证', '判断给定数组是否已按升序排列。\n\n**输入格式**\n第一行N，第二行N个整数。\n\n**输出格式**\n已排序输出"Yes"，否则输出"No"。', 'easy', '数组操作', ['arrays','sorting'], 1000, 256,
  [{input:'5\n1 2 3 4 5',output:'Yes'},{input:'5\n5 4 3 2 1',output:'No'},{input:'1\n42',output:'Yes'},{input:'3\n1 3 2',output:'No'},{input:'4\n1 1 2 2',output:'Yes'},{input:'2\n1 2',output:'Yes'},{input:'2\n2 1',output:'No'},{input:'3\n-1 0 1',output:'Yes'},{input:'5\n1 2 3 3 4',output:'Yes'},{input:'4\n1 2 1 2',output:'No'}]);

// Save partial results
console.log(`Generated ${allProblems.length} syntax problems so far`);
const output = `// Auto-generated problem seed data\n// Total: ${allProblems.length} problems\n\nexport const seedProblems = ${JSON.stringify(allProblems, null, 2)};\n`;
fs.writeFileSync(path.join(__dirname, 'problems-seed.ts'), output);
console.log('Saved to problems-seed.ts');
