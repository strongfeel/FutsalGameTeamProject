function gameplay() {
    let round = 0;
    let score1, score2 = 0;

    const diff = team1 - team2;
    const chance1 = Math.round(Math.random() * (50 + diff));
    const chance2 = Math.round(Math.random() * (50 - diff));

    while (round < 10){
        if(round % 2 ===0){
            if(chance1 > Math.random() * 100){
                score1++;
                console.log('1Team이 득점했습니다!');
            };
        } else {
            if(chance2 > Math.random() * 100){
                score2++;
                console.log('2Team이 득점했습니다!');
            };
        }
    };

    console.log(`경기 종료\n${score1} : ${score2}`);
    if(score1 > score2)
        console.log('승리');
    else if (score1 < score2)
        console.log('패배');
    else
        console.log('무승부')
}