// JavaScript Document

//visual
$(document).ready(function () {
  var dockBar = ".visual .dock-bar__stage"; //배너 순서 별 bar 길이
  var bannerClass = ".visual .container"; //배너 class
  var bannerEachClass = ".visual .container--0"; //각 배너 class
  var bannerImgClass = ".visual .main-image"; //배너 이미지 class

  var barLength = "210"; //bar 길이 (전체 dock-bar길이 / 배너 수)
  var barBtn = ".visual .dock-btn--"; //재생 버튼 auto,pause로 구분

  var cnt = 1; //최초 배너 순서
  var position = 0; //배너 최초 위치
  var bannerCnt = 2; //배너 수
  var timeOnOff; //타이머
  var onoff = true; // true=타이머 동작중 , false=타이머 동작중지

  var bannerImgSize = $(window).width(); //해상도별 배너 이미지 사이즈

  //최초 상태
  $(bannerClass).css("opacity", "0"); //전체 배너 노출 x
  $(bannerEachClass + cnt)
    .css("opacity", "1")
    .css("left", "0"); //첫번째 배너 노출

  $(bannerImgClass).css("width", bannerImgSize); //첫 화면 배너 이미지 사이즈 (이미지 크기에 따라 배너 사이즈 변경)
  $(dockBar).css("width", barLength).addClass("ani-strok"); //첫 배너 bar길이

  //배너 자동 재생
  function autoMove() {
    cnt++; //카운트 1씩 증가

    $(bannerClass).css("opacity", "0").css("left", "0"); //전체 배너 노출 x
    $(bannerEachClass + cnt)
      .css("opacity", "1")
      .css("left", -(bannerImgSize * (cnt - 1))); //관계 있는 배너만 노출

    $(dockBar)
      .css("width", barLength * cnt)
      .addClass("ani-strok"); //관계있는 배너 bar길이

    if (cnt == bannerCnt) cnt = 0;
  }

  timeOnOff = setInterval(autoMove, 4000);

  //실시간 배너이미지 사이즈 변경
  $(window).resize(function () {
    var bannerLiveSize = $(window).width(); //실시간 배너 이미지

    $(bannerImgClass).css("width", bannerLiveSize); //실시간 배너 이미지 사이즈 적용
  });

  //stop/play 버튼 클릭시 타이머 동작/중지
  $(".visual .dock-btn").click(function () {
    if (onoff == true) {
      // 타이머가 동작 유무
      clearInterval(timeOnOff); // 정보 처리 stop버튼 클릭시
      $(".visual .dock-btn--auto").css("display", "inline-block");
      $(".visual .dock-btn--pause").css("display", "none"); // js파일에서는 경로의 기준 html파일 기준
      onoff = false;
    } else {
      // false 타이머가 중지 상태 유무
      timeOnOff = setInterval(autoMove, 4000); //play버튼 클릭시 타이머 부활
      $(barBtn + "auto").css("display", "none");
      $(barBtn + "pause").css("display", "inline-block");
      onoff = true;
    }
  });
});

//gallery
function gallery() {
  var $this = $(this);

  //클릭 중복 방지
  if()
}
