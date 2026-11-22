/* Exile Zone study catalogue. Zone numbers follow the fan transcription, not official room names. */
(() => {
  "use strict";

  const tr = (ko: string, en: string, ja: string): LocalizedText => ({ko, en, ja});
  const wiki = "https://namu.wiki/w/데블스%20플랜:%20데드%20어게인/유배지";
  const panel = "https://docs.google.com/document/d/1tBPXuCcMpO4xpiQHFhDdQVlWIt3-OhRtgGIFeKNip_o/edit";
  const sources = {
    wiki,
    panel,
    mirror: "https://namu.moe/w/데블스%20플랜:%20데드%20어게인/유배지",
    clip: "https://www.youtube.com/watch?v=EDAsZtR3tMw",
    episode: "https://www.netflix.com/title/81653386",
    stellaNotes: "https://x.com/dori3021/status/2124038290345201768/photo/1",
  };
  const zones = ([
    [0,"배식대·음수대·모래시계","Food, water and hourglasses","配給台・給水器・砂時計","음식과 식수의 표기, 1시간·15분·1분 표시.","Food, drinking water and the 1-hour, 15-minute and 1-minute timers.","食べ物、飲み水、1時間・15分・1分の砂時計。"],
    [1,"길 위의 사람","The person on the road","道と人","위치와 길의 끝.","Location and the end of the road.","位置と道の端。"],
    [2,"양면 규칙 타일","Double-sided rule tiles","両面のルールタイル","한쪽은 한국어, 다른 쪽은 유배지 문자. 생존 조건과 두 가지 기회가 나온다.","Korean and glyphs occupy opposite sides. The text describes survival and two ways to return.","片面は韓国語、もう片面は記号。生存条件と二つの機会を示す。"],
    [3,"사람과 동물","People and animals","人と動物","먹이, 신체, 능력, 집 짓기, 알의 변화를 비교한다.","Food, anatomy, ability, nest building and hatching.","食物、体、能力、巣作り、卵の変化を比べる。"],
    [4,"신의 시험과 표","The divine trial and the grid","神の試練と表","표의 가로·세로·대각 합을 비교한다. 사진에서 가로합과 세로합 뒤에 등호가 있고 마지막 대각합 뒤는 비어 있다.","The row and column sums each have an equals sign after them. In the photograph the diagonal sum ends the comparison.","表の行と列の和にはそれぞれ等号が続く。写真では最後の対角線の和の後は空欄。"],
    [5,"별자리와 그림자","The constellation and shadow","星座と影","전갈자리와 사람 아래의 그림자.","The scorpion constellation and the shadow below a person.","サソリの星座と人の下にある影。"],
    [6,"물질과 색의 식","Materials and colour equations","物質と色の式","재료의 결합, 색 혼합, 뺄셈.","Combinations of materials, colour mixing and subtraction.","素材の組み合わせ、色の混合、引き算。"],
    [7,"출입문","Entrance","出入口","출입문 위치. 이 구역에 배정된 해독 문장은 확인되지 않는다.","Entrance location. The transcription gives no separate inscription here.","出入口の位置。ここに割り当てられた碑文は確認されていない。"],
    [8,"숫자 나선","Number spiral","数字のらせん","나선에 0부터 9까지의 수가 한 번씩 놓인다. 0은 빈칸이다.","Each digit occurs once around the spiral. Zero occupies a blank cell.","らせんに0から9までが一度ずつ並ぶ。0は空欄。"],
    [9,"소인과 거인","The small people and the giant","小人と巨人","크기, 복수, 죽음을 나타내는 동사와 도구 해석.","Size, plurality, the death verb and a possible instrument.","大小、複数、死を表す動詞と道具の読み。"],
    [10,"색 원판","Colour wheel","色の円盤","중앙의 색 표기와 원판 위 네 가지 색.","A central colour sign and four colours on the wheel.","中心の色の記号と円にある四色。"],
    [11,"전갈과 독","Scorpion and venom","サソリと毒","독의 소유와 섭취, 서식지.","Possession and ingestion of venom, and a habitat.","毒の所有・摂取と生息地。"],
    [12,"검은 구멍","The black hole","黒い穴","태양, 검은 달, 새 소리와 숨은 길의 단서.","The sun, the dark moon, birdsong and the path.","太陽、黒い月、鳥の声、道の手掛かり。"],
    [13,"검은 새와 죽은 사람","Black birds and a dead person","黒い鳥と死者","동물과 죽은 사람의 행동을 대비한다.","The actions of birds and a dead person.","鳥と死者の行動を比べる。"],
    [14,"시간과 지구","Time and the Earth","時間と地球","분·시간·일의 환산과 지구의 회전·공전.","Time units, the Earth's rotation and its orbit.","時間単位の換算と地球の自転・公転。"],
    [15,"머리의 구멍","Openings in the head","頭の穴","사람의 머리에 난 구멍을 먹기·보기·듣기와 연결한다.","Openings of the human head are associated with eating, sight and hearing.","人の頭にある穴と食べる・見る・聞くを対応させる。"],
  ] satisfies [number, string, string, string, string, string, string][]).map(([id, ko, en, ja, a, b, c]) => ({id, labels:tr(ko,en,ja), notes:tr(a,b,c), source:wiki + (id ? "#s-4." + id : "#s-4")}));

  const notes: Partial<Record<string, LocalizedText>> = {
    have: tr("같은 글자를 장소에서는 ‘있다’, 신체나 물건에는 ‘가지다’로 읽는다.","The same sign expresses location or possession, depending on its complements.","位置と所有のどちらを表すかは後に続く語で決まる。"),
    make: tr("집을 지을 때와 새가 알을 낳을 때 같은 글자가 쓰인다.","One verb covers building a nest and laying eggs.","巣を作る場合と卵を産む場合で同じ動詞を使う。"),
    from: tr("재료나 수단을 이끈다. 다른 명사의 소유를 표시하지 않는다.","Introduces a material or means. Possessive readings use a modifier instead.","材料や手段を導く。所有関係は修飾語で表す。"),
    "cannot-negation": tr("존재하지 않음을 뜻하며, ‘할 수 있다’ 다음에 놓이면 뒤 동작을 할 수 없다는 뜻이다.","It expresses absence on its own. After the modal it negates ability.","単独では不存在、可能を表す語の後では不可能を表す。"),
    unequal: tr("규칙 타일과 스텔라장의 필기에서 가로획 하나를 사선이 가로지른다. ‘없다’와 별개의 기호다.","On the rule tiles and in Stella Jang’s handwritten notes, a diagonal crosses one horizontal stroke. Absence has a separate sign.","ルールのタイルとステラ・チャンの手書きメモでは、横一本を斜線が横切る。不存在は別の記号。"),
    contest: tr("한국어 타일에서 대결은 두 번 나온다. 뒤섞인 문자 타일에서 같은 갈래 모양이 두 번 남아 이 글자를 대결에 대응시켰다. 글자와 뜻의 짝은 출현 횟수로 추론했다.","The Korean rule tiles mention a contest twice. Matching that count to the two remaining forked shapes on the shuffled tiles suggests this pairing.","韓国語のタイルでは対決が二度現れる。混ぜた記号のうち枝分かれした形が二つ残り、出現数から対応を推定した。"),
    win: tr("규칙의 승리 동사 한 자리를 두 팔을 든 사람 모양과 대응시켰다. 남은 타일의 출현 횟수와 방송에서 이 글자를 승리처럼 보인다고 한 말을 근거로 한 추정이다.","One victory verb remains in the rule text. The frequency match and the players’ remark that the raised-arms shape looks like victory support this identification.","ルールに勝利の動詞が一つ残る。出現数と、両腕を上げた形が勝利に見えるという出演者の発言から対応を推定した。"),
    zero: tr("인쇄할 획 없이 한 자리를 차지한다. 두 자리 이상 수도 이 빈칸을 유지한다.","A blank tile with a full position, including inside a multidigit number.","線のない一桁。複数桁の数字の中でも空欄を保つ。"),
    die: tr("목적어가 있으면 ‘죽이다’, 목적어가 없으면 ‘죽다’로 읽힌다.","Read ‘die’ without an object and ‘kill’ with one.","目的語がなければ「死ぬ」、あれば「殺す」と読める。"),
    death: tr("동사 ‘죽다’와 같은 계열의 명사로 읽힌다.","A noun in the same family as the verb ‘die’.","「死ぬ」と同系の名詞。"),
    dwell: tr("거처를 뜻하는 ‘집’의 동사형. 생존을 뜻하는 ‘살다’는 별도 어근이다.","The verb related to ‘house’ concerns dwelling. Survival has a different root.","「家」と同根の動詞。生き延びることには別の語根を使う。"),
    "with-spear": tr("창을 도구로 삼는다는 풀이가 있다. 이 글자는 한 번만 나와 ‘여러 방향에서’라는 위치 풀이도 남는다.","‘With a spear’ fits the picture. A single occurrence also permits a proposed locative reading, ‘from several directions’.","絵から「槍で」と読まれる。一例のみで、「各方向から」という位置の解釈もある。"),
    red: tr("불 글자 아래에 두 점을 더해 빨간색을 쓴다.","Two dots below the fire sign give red.","火の文字の下に二点を添えると赤色になる。"),
    blue: tr("바다 글자 아래에 두 점을 더해 파란색을 쓴다.","Two dots below the sea sign give blue.","海の文字の下に二点を添えると青色になる。"),
    white: tr("소금 글자 아래에 두 점을 더해 흰색을 쓴다.","Two dots below the salt sign give white.","塩の文字の下に二点を添えると白色になる。"),
    black: tr("숯 모양 아래에 두 점이 있고 위에 형용사 표지가 있다. ‘검은 달’과 ‘검은 새’에 쓰인다.","The charcoal shape has two dots below and an adjective mark above. It describes the black moon and black birds.","木炭の形の下に二点、上に形容詞の印が付く。黒い月や黒い鳥を表す。"),
    clear: tr("유리 글자 아래에 두 점을 더해 투명을 쓴다.","Two dots below the glass sign give clear.","ガラスの文字の下に二点を添えると透明を表す。"),
    purple: tr("빨간색과 파란색을 합친 결과와 색 원판에 같은 글자가 쓰인다. 아래 두 점은 색을 나타낸다. 그 위의 도형이 가리키는 사물은 알려지지 않았다.","The red-and-blue mixing equation and the colour wheel show the same sign. Its two lower dots mark colour. The object represented above them is unknown.","赤と青を混ぜた結果と色の円盤に同じ文字がある。下の二点は色を示す。その上の形がどんな物を表すかは不明。"),
    divine: tr("‘신의 시험’에서는 소유·관계, 표의 숫자를 꾸밀 때에는 ‘신비로운’이라는 해석도 있다.","Relational in the divine trial. A ‘magical’ reading has been proposed for the grid's numbers.","試練では「神の」。表の数については「神秘的な」という解釈もある。"),
    sixth: tr("날 또는 새 소리의 순서를 센다. 끝점이 붙은 숫자를 여섯 번째 신호로 읽는다.","Marks the sixth day or sixth bird call. The terminal dot orders events.","第六日、または六回目の鳥の声。数字の端の点が順序を示す。"),
    life: tr("표지 없는 접속사 ‘그리고’와 비슷한 몸체가 있어 표지를 함께 봐야 한다.","Its body resembles unmarked ‘and’. The noun mark distinguishes the life word.","標識のない「そして」と本体が似ており、名詞標識で区別する。"),
    know: tr("머리의 마름모 몸체에 동사점이 붙으면 '알다'로 읽힌다. 머리라는 명사와 대응한다.","The open diamond in ‘head’ receives a verb dot for ‘know’.","「頭」の開いた菱形に動詞の点を付けると「知る」と読む。"),
    total: tr("‘합치다’의 두 고리 위에 명사 가로선이 붙어 합을 나타낸다.","A noun bar over the two rings used for ‘combine’ gives ‘sum’.","「合わせる」の二つの輪に名詞の横線を付けると「和」。"),
    cover: tr("그림자를 뜻하는 명사와 같은 몸체에 동사점을 붙인 글자다. 태양을 가리는 장면에 나온다.","The shadow noun and the verb share a body. In the sun clue its verb means to cover or shade.","「影」と同じ本体に動詞の点を付ける。太陽を覆う場面で使う。"),
    day: tr("시간을 세는 단위인 하루. 밤과 짝을 이루는 ‘낮’은 다른 글자로 쓴다.","A day as a unit of time. Daylight, paired with night, has its own sign.","時間単位の一日。夜と対になる「昼」は別の文字で表す。"),
    end: tr("길 그림과 검은 구멍의 길에 같은 끝막힌 화살표가 쓰인다.","The road panel and the black-hole panel use the same arrow ending in a stop.","道の絵と黒い穴の道には同じ終端つき矢印がある。"),
    lower: tr("‘아래의’는 인원수에서는 상한 이하의 뜻, 표 앞에서는 공간의 ‘아래’로 읽힌다.","A lower-position modifier can describe a numerical limit or a grid below.","位置を表す「下の」が人数では上限、表では位置を示す。"),
    first: tr("규칙 타일에 쓰인 첫째. 숫자 1의 안쪽 왼쪽 끝에 붙은 점으로 기본 숫자와 구분한다.","The first rule uses this ordinal. A dot on the inner left endpoint distinguishes it from one.","ルールの一つ目を指す。1の内側左端についた点で基数と区別する。"),
    second: tr("규칙 타일에 쓰인 둘째. 숫자 2의 왼쪽 아래 끝에 붙은 점으로 기본 숫자와 구분한다.","The second rule uses this ordinal. A dot on the lower left endpoint distinguishes it from two.","ルールの二つ目を指す。2の左下端についた点で基数と区別する。"),
    food: tr("배식대에서 ‘먹다’의 명사형을 먹이 또는 음식으로 풀이한다.","The food station supplies the noun related to ‘eat’.","配給台で「食べる」と同根の名詞を食物と読む。"),
    edible: tr("음수대에서 물을 꾸미는 ‘먹는’으로 풀이한다. 물과 함께 식수를 뜻한다.","The water station uses an attributive form with ‘water’ for drinking water.","給水器では「水」を修飾し、二語で飲み水を指す。"),
    color: tr("사물 아래의 두 점과 원판 중앙에 놓인 ‘색’이라는 말을 구분한다.","The two dots on a material are distinct from the word ‘colour’ at the centre of the wheel.","物体の下の二点と、円盤中央の「色」という語を区別する。"),
    seeing: tr("‘보는 방법’에서 뒤의 명사를 꾸미는 ‘보다’의 형태로 읽힌다.","An attributive form of ‘see’ that modifies ‘way’.","「見る方法」で後ろの名詞を修飾する形。"),
  };

  type InventoryRow = [id: string, ko: string, en: string, ja: string, zones: string, root?: string];
  const inventory: Record<GlyphClass, InventoryRow[]> = {
    noun: [
      ["bird","새","bird","鳥","3 12 13"], ["spider","거미","spider","クモ","3"], ["person","사람","person","人","1 2 3 4 5 9 11 12 13"], ["fruit","열매","fruit","果実","3"], ["cow","소","cow","牛","3"], ["grass","풀","grass","草","3"], ["snake","뱀","snake","ヘビ","3 11"], ["house","집","house","家","3"], ["tree","나무","tree","木","1 3 6"], ["arm","팔","arm","腕","3"], ["leg","다리","leg","脚","3"], ["head","머리","head","頭","3 15"], ["tail","꼬리","tail","しっぽ","3 11"], ["egg","알","egg","卵","3"], ["road","길","road","道","1 12"], ["here","이곳","this place","この場所","2 12"], ["life","삶","life","生","2","live"], ["death","죽음","death","死","2","die"], ["contest","대결","contest","対決","2"], ["way","방법","way","方法","2 12"], ["trial","시험","trial","試練","2 4 12"], ["day","하루","day","一日","2 14"], ["grid","표","grid","表","4"], ["number","숫자","number","数","4 8"], ["total","합","sum","和","4","combine"], ["constellation","별자리","constellation","星座","5"], ["shadow","그림자","shadow","影","5"], ["fire","불","fire","火","6"], ["charcoal","숯","charcoal","木炭","6"], ["red","빨간색","red","赤色","6 10"], ["blue","파란색","blue","青色","6 10"], ["purple","보라색","purple","紫色","6 10"], ["sand","모래","sand","砂","6 11"], ["glass","유리","glass","ガラス","6"], ["sea","바다","sea","海","6"], ["water","물","water","水","0 6"], ["salt","소금","salt","塩","6"], ["clear","투명","clear","透明","6"], ["color","색","colour","色","10"], ["white","흰색","white","白色","10"], ["poison","독","venom","毒","11"], ["scorpion","전갈","scorpion","サソリ","11"], ["hole","구멍","hole","穴","12 15"], ["god","신","god","神","12"], ["sun","태양","sun","太陽","12 14"], ["moon","달","moon","月","12"], ["daylight","낮","daylight","昼","12"], ["night","밤","night","夜","12"], ["hour","시간","hour","時間","0 14"], ["minute","분","minute","分","0 14"], ["earth","지구","Earth","地球","14"], ["food","음식","food","食べ物","0","eat"]
    ],
    verb: [
      ["eat","먹다","eat","食べる","3 11 13 15"], ["sound","소리 내다","make a sound","音を出す","3 12 13 15"], ["make","만들다","make","作る","3 4"], ["have","있다","have","ある","1 2 3 5 11 12 15"], ["become","되다","become","なる","3 12"], ["cannot-negation","없다","lack","ない","3 4 13"], ["see","보다","see","見る","5 12 15"], ["live","살아남다","live","生きる","2"], ["pass","통과하다","pass","通過する","2 4"], ["win","이기다","win","勝つ","2"], ["combine","합치다","combine","合わせる","6"], ["subtract","빼다","subtract","引く","6"], ["die","죽다","die","死ぬ","2 4 9 11"], ["dwell","거주하다","dwell","住む","11","house"], ["know","알다","know","知る","12","head"], ["cover","가리다","cover","覆う","12","shadow"], ["turn","돌다","turn","回る","14"], ["hear","듣다","hear","聞く","15"]
    ],
    adjective: [
      ["small","작은","small","小さい","3 9"], ["lower","아래의","lower","下の","2 4","below"], ["divine","신의","divine","神の","2 4 12","god"], ["final","마지막의","final","最後の","2","end"], ["grid-adj","표의","of the grid","表の","4","grid"], ["horizontal","가로의","horizontal","横の","4"], ["number-adj","숫자의","of the numbers","数の","4","number"], ["vertical","세로의","vertical","縦の","4"], ["diagonal","대각선의","diagonal","対角の","4"], ["scorpion-adj","전갈의","scorpion's","サソリの","5 11","scorpion"], ["large","큰","large","大きい","9 15"], ["black","검은","black","黒い","12 13"], ["seeing","보는","for seeing","見るための","12","see"], ["dead","죽은","dead","死んだ","12 13","die"], ["person-adj","사람의","person's","人の","15","person"], ["upper","위의","upper","上の","15","on"], ["left","왼쪽의","left","左の","15"], ["right","오른쪽의","right","右の","15"], ["edible","먹는","for consumption","飲食用の","0","eat"]
    ],
    adverb: [
      ["on","위에","on top","上に","1"], ["end","끝에","at the end","端に","1 12"], ["here-location","이곳에","here","ここに","2","here"], ["below","아래에","below","下に","5 12"], ["with-spear","창으로","with a spear","槍で","9"], ["in-hole","구멍에","in the hole","穴に","12","hole"]
    ],
    number: [
      ["zero","0","zero","零","3 8 14"], ["one","1","one","一","0 2 4 6 8 14 15"], ["two","2","two","二","2 3 8 14 15"], ["three","3","three","三","8 14"], ["four","4","four","四","2 3 8 14"], ["five","5","five","五","0 6 8 14"], ["six","6","six","六","6 8 14"], ["seven","7","seven","七","8 15"], ["eight","8","eight","八","3 8"], ["nine","9","nine","九","8"]
    ],
    ordinal: [["first","첫 번째","first","一番目","2","one"],["second","두 번째","second","二番目","2","two"],["sixth","여섯 번째","sixth","六番目","2 12","six"]],
    conjunction: [["and","그리고","and","そして","3 15"],["or","또는","or","または","2 15"],["then","그러면","then","そうすれば","2 4 11 12"]],
    operator: [["equal","같다 (=)","equals (=)","等しい (=)","4 6 14"],["unequal","같지 않다 (≠)","not equal (≠)","等しくない (≠)","2"]],
    preposition: [["from","~(으)로","with / from","〜を使って","2 3 12"]],
    auxiliary: [["can","할 수 있다","can","できる","2 3 4 12 13"]],
    marker: [["plural","복수 표시","plural marker","複数の印","3 4 9 12 13"]],
    pronoun: [["you","당신","you","あなた","2 4 12"]],
  };

  // Alternate glosses cover the same reading in its panel context.
  const aliases: Partial<Record<string, WordAliases>> = {
    tree:{ko:["목재"],en:["wood"],ja:["木材"]}, fruit:{ko:["과일"],ja:["果物","木の実"]},
    house:{ko:["둥지","거처"],en:["home","nest"],ja:["住まい","巣"]},
    grass:{en:["grass"]}, poison:{ko:["독액"],en:["poison"],ja:["毒液"]},
    make:{ko:["짓다"],en:["build"],ja:["建てる"]}, sound:{ko:["소리를 내다","소리내다"],en:["make noise"],ja:["声を出す"]},
    god:{ko:["신"],en:["deity"],ja:["神様"]}, divine:{ko:["신성한"],en:["of God","God's"],ja:["神聖な"]},
    here:{ko:["이 곳","여기"],en:["this location"],ja:["この所"]}, "here-location":{ko:["여기에"],en:["in this place"],ja:["この場所に"]},
    day:{ko:["날","일"],en:["one day"],ja:["日"]}, daylight:{ko:["대낮"],en:["daytime"],ja:["昼間"]},
    final:{ko:["최후의","끝의"],en:["last"],ja:["最終の"]}, way:{ko:["방식"],en:["method"],ja:["やり方"]},
    "scorpion-adj":{en:["of the scorpion"],ja:["蠍の"]}, "person-adj":{ko:["인간의"],en:["of a person","human's"],ja:["人間の"]},
    live:{ko:["살다","생존하다"],en:["survive"],ja:["生き延びる"]}, dwell:{ko:["살다","살고 있다"],en:["reside","live in"],ja:["暮らす"]},
    die:{ko:["죽이다"],en:["kill"],ja:["殺す"]}, below:{ko:["밑에"],en:["under","beneath"],ja:["下方に"]},
    on:{ko:["위에"],en:["on"],ja:["上に"]}, end:{ko:["끝에서"],en:["at the end of"],ja:["終わりに"]},
    contest:{ko:["시합"],en:["match"],ja:["試合"]}, grid:{ko:["격자","표"],en:["table"],ja:["格子"]},
    total:{ko:["합계"],en:["total"],ja:["合計"]}, combine:{ko:["더하다","섞다"],en:["add","mix"],ja:["足す","混ぜる"]},
    red:{ko:["빨강","빨강색","적색"],ja:["赤"]}, blue:{ko:["파랑","파랑색","청색"],ja:["青"]},
    purple:{ko:["보라","보랏빛"],en:["violet"],ja:["紫","むらさき"]}, white:{ko:["하얀색","하양","백색"],ja:["白"]},
    "red--adjective":{ko:["빨간색","빨강","붉은","빨간색의"],ja:["赤の","赤色の"]},
    "blue--adjective":{ko:["파란색","파랑","푸른","파란색의"],ja:["青の","青色の"]},
    "white--adjective":{ko:["하얀","흰색","흰색의"],ja:["白の","白色の"]},
    "purple--adjective":{ko:["보라색","보라색의","보랏빛의"],en:["violet"],ja:["紫色の","むらさきの"]},
    "black--noun":{ko:["검정색","검정","까만색","흑색"],ja:["黒"]},
    "clear--adjective":{ko:["투명","투명색의"],en:["clear"],ja:["無色透明の"]},
    clear:{ko:["투명색","무색투명"],en:["transparent","transparency"],ja:["無色透明"]}, color:{ko:["색깔"],en:["color"],ja:["色彩"]},
    "with-spear":{ko:["창을 써서"],en:["using a spear"],ja:["槍を使って"]}, black:{ko:["검정의","까만","검은색","검정색"],en:["black"],ja:["黒の","黒色の"]},
    pass:{ko:["통과하다","합격하다"],ja:["突破する","合格する"]}, win:{ko:["승리하다"],en:["prevail"],ja:["勝利する"]},
    trial:{ko:["시험"],en:["test"],ja:["試験"]}, six:{ko:["여섯"],en:["6"],ja:["6","ろく"]},
    food:{ko:["먹이","먹을 것"],en:["feed"],ja:["餌","食物"]},
    edible:{ko:["먹을 수 있는","식용의","마실 수 있는"],en:["edible","drinkable","drinking"],ja:["食用の","飲用の"]},
    cover:{ko:["그늘지게 하다","덮다"],en:["shade","screen"],ja:["隠す"]}, "drinking-water":{ko:["먹는 물","마실 물"],en:["potable water"],ja:["飲料水"]},
  };

  const entries: CatalogEntry[] = [];
  const byId = new Map<string, CatalogEntry>();
  const positionClasses: InflectedClass[] = ["noun","verb","adjective","adverb"];
  const classLabels: Record<InflectedClass, LocalizedText> = {
    noun:tr("명사형","noun form","名詞形"), verb:tr("동사형","verb form","動詞形"),
    adjective:tr("형용사형","adjective form","形容詞形"), adverb:tr("부사형","adverb form","副詞形")
  };
  const colorMaterial: Partial<Record<string, string | null>> = {red:"fire",blue:"sea",white:"salt",clear:"glass",black:"charcoal",purple:null};
  const evidence: Partial<Record<string, ReadingStatus>> = { "with-spear":"interpreted" };
  const priorGlyphs = new Set("bird eat spider person fruit cow grass snake can sound make house from tree have two arm zero leg four head and tail eight egg plural become small cannot-negation road on end see".split(" "));
  function compiledShape(id: string) {
    const map = window.ExileGlyphMap;
    return map ? Object.prototype.hasOwnProperty.call(map,id) : priorGlyphs.has(id);
  }
  function add(entry: CatalogEntry) {
    byId.set(entry.id,entry);
    entries.push(entry);
  }
  for (const pos of Object.keys(inventory) as GlyphClass[]) {
    const group = inventory[pos];
    for (const [id, ko, en, ja, places, root = id] of group) {
      const zonesSeen = places.split(" ").map(Number);
      const entry: CatalogEntry = {id,root,pos,labels:tr(ko,en,ja),zones:zonesSeen,status:evidence[id] || "attested",meaningKnown:true,
        modelFrom:id,notes:notes[id],aliases:aliases[id],source:wiki + (zonesSeen[0] ? "#s-4." + zonesSeen[0] : "#s-4"),
        get shapeId() { return compiledShape(id) ? id : null; }};
      if (Object.hasOwn(colorMaterial,id)) { entry.colorOf = colorMaterial[id]; entry.color = true; }
      add(entry);
    }
  }

  function rootEntry(root: string) {
    const base = byId.get(root);
    if (!base) throw new Error("Missing root " + root);
    return base;
  }
  function addInferred(root: string, pos: GlyphClass, labels: LocalizedText, explanation: LocalizedText, modelFrom = root) {
    const base = rootEntry(root);
    const id = root + "--" + pos;
    add({id,root,pos,labels,status:"inferred",meaningKnown:true,modelFrom,
      get shapeId(){return compiledShape(id) ? id : null;}, zones:[], basisZones:[...base.zones],
      source:base.source, notes:explanation,aliases:aliases[id]});
  }
  const relational = tr("확인된 명사 수식 방식으로 이 어근을 적용한 예측이다. 뒤 명사에 따라 소유·재료·관계 등으로 읽을 수 있다.","A proposed application of the attested modifier pattern. The following noun determines possession, material or another relation.","確認される名詞修飾の型をこの語根に当てはめた推定。所有・材料・関係は後続の名詞で決まる。");
  const relationRoots = ("bird spider fruit cow grass snake house tree arm leg head tail egg road contest way trial day " +
    "constellation shadow fire charcoal sand glass sea water salt poison hole sun moon daylight night hour minute earth").split(" ");
  for (const root of relationRoots) {
    if (entries.some(e => e.root === root && e.pos === "adjective")) continue;
    const {ko,en,ja} = rootEntry(root).labels;
    const enLabel = ["bird","spider","cow","snake"].includes(root) ? en + "'s" : "of " + en;
    addInferred(root,"adjective",tr(ko+"의",enLabel,ja+"の"),relational);
  }
  addInferred("you","adjective",tr("당신의","your","あなたの"),relational);
  const lexicalInference = tr("같은 어근의 확인된 글자에 다른 품사표지를 적용한 후보 번역이다. 이 뜻의 용례는 아직 확인되지 않았다.","A proposed reading made by changing the mark on an attested root. This specific usage is unverified.","確認された語根の標識を変えた場合の訳の候補。この意味での用例は未確認。");
  for (const [root,pos,ko,en,ja] of [
    ["sound","noun","소리","sound","音"],["make","noun","만들기","making","制作"],
    ["pass","noun","통과","passing","通過"],["win","noun","승리","victory","勝利"],["turn","noun","회전","rotation","回転"],
    ["hear","noun","듣기","hearing","聞くこと"],["see","noun","보기","seeing","見ること"],
    ["subtract","noun","뺄셈","subtraction","引き算"],
    ["small","noun","작음","smallness","小ささ"],["large","noun","큼","largeness","大きさ"],
    ["left","adverb","왼쪽에","on the left","左に"],["right","adverb","오른쪽에","on the right","右に"],
    ["horizontal","adverb","가로로","horizontally","横に"],["vertical","adverb","세로로","vertically","縦に"],
    ["diagonal","adverb","대각선으로","diagonally","斜めに"],
    ["red","adjective","빨간","red","赤い"],["blue","adjective","파란","blue","青い"],
    ["purple","adjective","보랏빛","purple","紫の"],["white","adjective","흰","white","白い"],
    ["clear","adjective","투명한","transparent","透明な"],["black","noun","검은색","black","黒色"],
  ] satisfies [string, InflectedClass, string, string, string][]) addInferred(root,pos,tr(ko,en,ja),lexicalInference);

  const ordinalLabels = [
    ["three","세 번째","third","三番目"],["four","네 번째","fourth","四番目"],
    ["five","다섯 번째","fifth","五番目"],["seven","일곱 번째","seventh","七番目"],
    ["eight","여덟 번째","eighth","八番目"],["nine","아홉 번째","ninth","九番目"]
  ];
  for (const [root,ko,en,ja] of ordinalLabels) addInferred(root,"ordinal",tr(ko,en,ja),
    tr("첫째·둘째·여섯째의 끝점 규칙을 일반화했다. 이 서수의 원문 표기는 확인되지 않았다.","The terminal-dot pattern is extended from first, second and sixth. This written ordinal is unconfirmed.","第一・第二・第六の端点規則から推定した序数。この形の原文は未確認。"));

  const phrases: [id: string, sequence: string[], zones: number[], ko: string, en: string, ja: string][] = [
    ["drinking-water",["edible","water"],[0],"식수","drinking water","飲み水"],
    ["one-hour",["one","hour"],[0,14],"1시간","one hour","1時間"],
    ["fifteen-minutes",["one","five","minute"],[0],"15분","fifteen minutes","15分"],
    ["one-minute",["one","minute"],[0],"1분","one minute","1分"],
    ["eleven",["one","one"],[6],"11","eleven","十一"],
    ["sixty-minutes",["six","zero","minute"],[14],"60분","sixty minutes","60分"],
    ["twenty-four-hours",["two","four","hour"],[14],"24시간","twenty-four hours","24時間"],
    ["three-sixty-five-days",["three","six","five","day"],[14],"365일","365 days","365日"],
  ];
  for (const [id,sequence,at,ko,en,ja] of phrases) add({id,root:id,pos:"phrase",labels:tr(ko,en,ja),
    status:"attested",zones:at,sequence,aliases:aliases[id],meaningKnown:true,shapeId:null,source:wiki+"#s-4"+(at[0]?"."+at[0]:"")});

  const rules = ([
    ["word-order","문장의 어순","Sentence order","文の語順","주어 다음에 술어를 쓰고, 그 뒤에 목적어나 보어를 놓는다. 한국어·일본어 어순과 다르게 ‘새가 열매를 먹는다’는 새 → 먹다 → 열매 순서다.","The subject precedes the predicate, followed by its object or complement. An animal eating a fruit is written animal → eat → fruit.","主語・述語・目的語または補語の順。「鳥が果実を食べる」は鳥 → 食べる → 果実。",[1,3]],
    ["class-marks","네 품사표지","Four word-class marks","四つの品詞標識","어근 위의 가로선은 명사, 점은 동사, 오른쪽으로 올라가는 사선은 형용사, 내려가는 사선은 부사다. 품사만 예측할 수 있는 조합도 있다.","A bar above a root marks a noun, a dot a verb, a rising slash an adjective, and a falling slash an adverb. A predicted class alone does not supply a unique meaning.","語根の上の横線は名詞、点は動詞、右上がりは形容詞、右下がりは副詞。品詞のみ推定できる組み合わせもある。",[1,3,5,9,12,15]],
    ["modifier","수식과 소유","Modifiers and possession","修飾と所有","전갈 + 형용사표지는 꼬리 앞에서는 ‘전갈의’, 별자리 앞에서는 어떤 별자리인지 알려 준다. 사람의 머리도 같은 짜임이다. 소유자는 별도 표지를 덧붙이지 않는다.","The scorpion modifier identifies the owner of a tail and the type of a constellation. The person's head follows the same pattern. Context supplies the relationship.","サソリの修飾形は尾の持ち主にも星座の種類にも使う。「人の頭」も同じ型。関係は文脈で決まる。",[4,5,11,15]],
    ["location","위치와 거주","Location and dwelling","位置と居住","‘있다’와 장소를 함께 쓸 때는 ‘길 끝에’처럼 위치를 나타내는 부사형이 보인다. ‘거주하다’ 뒤에는 모래가 명사형으로 온다.","Location with ‘be’ can use an adverbial complement such as ‘at the end of the road’. The dwelling verb takes ‘sand’ as a noun.","存在の位置には副詞形を使う例がある。「住む」の後の「砂」は名詞形。",[1,5,11,12]],
    ["color","두 점과 색","The two colour dots","色を作る二点","사물 아래의 두 점이 그 사물의 색을 가리킨다. 불·바다·소금·숯·유리는 각각 빨강·파랑·흰색·검정·투명과 연결된다. 보라의 바탕 사물은 미확인이다.","Two dots below an object refer to its colour. Fire, sea, salt, charcoal and glass give red, blue, white, black and clear. Purple's base object remains unidentified.","物体の下の二点がその色を表す。火・海・塩・木炭・ガラスから赤・青・白・黒・透明が読める。紫の元の物体は不明。",[6,10,12,13]],
    ["digits","숫자와 자릿값","Digits and place value","数字と位取り","0은 빈칸 하나다. 숫자를 차례로 써서 11, 24, 60, 365 같은 수를 만든다. 모래시계에도 수와 단위가 쓰인다.","Zero occupies a blank cell. Adjacent digits build numbers such as 11, 24, 60 and 365. Hourglasses pair numbers with units.","0は一つの空欄。数字を順に置いて11・24・60・365などを表す。砂時計にも数と単位がある。",[0,3,6,8,14]],
    ["ordinal","순서와 횟수","Ordinals and occurrences","順序と回数","수사 획의 끝점이 차례를 표시한다. 둘째와 두 개를 구분하며, 새 소리에서는 여섯 번째 울음으로 읽힌다. 공백인 0의 끝점은 알 수 없다.","A dot at a numeral's stroke end signals order. The sixth bird call is an event count. Zero has no visible stroke endpoint.","数字の線の端の点が順序を表す。鳥の声なら六回目。空欄の0には見える端がない。",[2,8,12]],
    ["functional","품사표지 없는 글자","Unmarked signs","品詞標識のない記号","접속·조건, 수단, 가능, 복수, 숫자, 등호·부등호에는 별도 형태가 있다. 보통 어근의 네 가지 표지를 이들에 일괄 적용하지 않는다.","Connectors, conditionals, means, ability, plurality, digits and comparison operators have their own forms. The four-mark pattern applies to lexical roots.","接続・条件・手段・可能・複数・数字・等号・不等号には独立した形がある。四品詞の置換は通常の語根に使う。",[2,3,4,6,8]],
    ["negation","없음과 부정","Absence and negation","不存在と否定","‘할 수 있다’와 ‘없다’를 함께 쓰면 뒤 동작의 불가능을 나타낸다. 규칙 타일의 부등호는 두 대상이 같지 않다는 뜻이다.","The modal plus the absence verb negates an action's possibility. The inequality sign compares two terms.","可能の語と不存在の動詞で後の動作が不可能になる。不等号は二項を比較する。",[2,3,4,13]],
    ["valency","목적어가 바꾸는 동사 뜻","Verbs and their objects","目的語と動詞の意味","죽음을 나타내는 동사는 주어만 있으면 죽는 사건을, 목적어가 더해지면 그 대상을 죽이는 사건을 나타낸다.","The death verb is intransitive with a lone subject and causative with an object.","死の動詞は主語だけなら「死ぬ」、対象が加われば「殺す」と読める。",[2,4,9,11]],
    ["locative-or-tool","한 번만 나온 도구 풀이","A disputed instrumental reading","一例の道具解釈","거인을 둘러싼 사람들 옆 문장의 마지막 글자는 ‘창으로’로 풀이하지만 다른 위치 해석도 제안됐다. 수단을 표시하는 독립 전치사는 다른 문장에 확인된다.","The final sign next to the picture of a giant has been glossed ‘with a spear’, but a spatial interpretation also exists. A separate instrumental preposition occurs elsewhere.","巨人の絵に添えられた文の末尾にある「槍で」には、場所を示す別解もある。別の文には独立した手段の前置詞がある。",[3,9,12]],
  ] satisfies [string, string, string, string, string, string, string, number[]][]).map(([id,ko,en,ja,a,b,c,zones]) => ({id,labels:tr(ko,en,ja),notes:tr(a,b,c),zones,source:wiki+"#s-4"}));

  function family(id: string): CatalogEntry[] {
    const selected = byId.get(id);
    if (!selected) return [];
    const root = selected.root;
    const members = entries.filter(e => e.root === root);
    const base = byId.get(root) || selected;
    const classOf = (entry: CatalogEntry) => entry.pos === "pronoun" ? "noun" : entry.pos;
    if (!positionClasses.some(pos => pos === classOf(base))) return members;
    const result = [...members];
    for (const pos of positionClasses) {
      if (members.some(e => classOf(e) === pos)) continue;
      result.push({id:root+"--"+pos,root,pos,labels:classLabels[pos],status:"inferred",meaningKnown:false,
        zones:[],basisZones:base.zones,shapeId:null,modelFrom:base.id,source:base.source,
        notes:tr("이 어근에 품사표지를 바꾼 조합이다. 구체적인 어휘 뜻은 확인되지 않았다.",
          "The root and class can be combined formally. A lexical meaning has not been established.",
          "この語根と品詞標識の形式的な組み合わせ。語としての意味は未確認。")});
    }
    // A colour relation is a bottom-dot derivation, separate from changing the top mark.
    result.push(...entries.filter(e => e.colorOf === root));
    return result;
  }
  const forms = new Map(entries.map(e => [e.id,e]));
  for (const root of new Set(entries.map(e => e.root))) {
    for (const form of family(root)) if (!forms.has(form.id)) forms.set(form.id,form);
  }
  window.ExileCatalog = {entries,zones,rules,sources,forms:[...forms.values()],
    family: id => family(forms.get(id)?.root || id), get: id => forms.get(id)};
})();
