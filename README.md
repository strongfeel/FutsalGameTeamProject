# futsalGame
3 대 3 풋살 게임을 만들어 보았습니다.

## 와이어프레임
![image](https://github.com/user-attachments/assets/6556dd72-ba46-4a05-90e5-9d5a6cd8f97e)

## API명세서
https://teamsparta.notion.site/f91f4a8c97694aa3962ea9dbbaf45558?v=8334719013574f3d9fdd2a90d013de46&pvs=4

## ERD DIAGRAM
![image](https://github.com/user-attachments/assets/e16f7dc2-d209-4db3-8395-5b3991c1afc3)

## TROUBLE SHOOTING
branch 병합 후 코드는 다른 점이 없지만 프로젝트 실행 시, 다른 팀원의 프로젝트가 구동시 몇몇 부분이 오류가 발생 했다.
node 버전도 같고 yarn버전도 같았지만, 별다른 이상한 점을 찾을 수 없었다.
그래서 혹시나 몰라서 nodemodules 파일을 삭제 후 재 설치를 하였고 실행을 해보니 또 오류가 발생을 했다.
그러던 와중 lock파일이 두개인 것을 확인하고 package-lock.json 파일을 삭제하고 재시작을 해보니 오류가 해결됬다.
전체 적으로 Yarn을 사용하여 프로젝트를 구축 했지만, branch 병합후 yarn.lock 파일과 package-lock.json 파일이 둘다 생성되어 있어서 충돌이 일어났다.
