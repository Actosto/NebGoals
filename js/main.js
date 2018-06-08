'use strict';

let account = new Account();
let contract = new ContractApi();
let isExtensionExist;

window.addEventListener('message', function (e) {
    if (e.data.data && !!e.data.data.account) {
        account.setWallet(e.data.data.account);
    }
});

$(document).ready(() => {
    isExtensionExist = typeof (webExtensionWallet) !== "undefined";

    if (!isExtensionExist) {
        document.querySelector(".noExtension").attributes.removeNamedItem("hidden");
    }

    window.postMessage({
        "target": "contentscript",
        "data": {},
        "method": "getAccount",
    }, "*");

    onCreateHandler();
    onEditHandler();
    onMarkHandler();
    loadMyGoalsHandler();

    $("#openAdPopup").on('click', () => {
        $("#createModal .status").html("");
    });

    loadGoals();
});

function onCreateHandler() {
    $(`#createForm`).submit((event) => {
        event.preventDefault();

        let title = $(`#create-title`).val();
        let message = $(`#create-message`).val();
        let amount = $(`#create-amount`).val();
        let isMarked = $(`#create-isMarked`).prop('checked');

        $("#createModal .status").html(getLoader());

        contract.create(title, message, amount, isMarked,
            resp => {
                $("#createModal .status").html(goodStatus());
                loadGoals();
            },
            err => {
                $("#createModal .status").html("");

                if (err.rejected) {
                    showStatusRegected("Goal creating");
                } else {
                    let error = err.execute_error ? err.execute_error : err.execute_result;
                    let message =
                        `<i class="fa fa-exclamation-triangle"></i>
                        <div> ${error} </div>`;
                    showStatus("Error", message);
                }
            }
        );
    });
}

function onEditHandler() {
    $(`#editForm`).submit((event) => {
        event.preventDefault();

        let id = $(`#editForm`).attr('data-id');
        let title = $(`#edit-title`).val();
        let message = $(`#edit-message`).val();
        let amount = $(`#edit-amount`).val();
        let isMarked = $(`#edit-isMarked`).prop('checked');
        let wasMarked = $(`#edit-wasMarked`).prop('checked');

        $("#editModal .status").html(getLoader());

        contract.edit(id, title, message, amount, isMarked, wasMarked, resp => {
                $("#editModal .status").html(goodStatus());
                loadGoals();
            },
            err => {
                $("#editModal .status").html("");

                if (err.rejected) {
                    showStatusRegected("Goal editing");
                } else {
                    let error = err.execute_error ? err.execute_error : err.execute_result;
                    let message =
                        `<i class="fa fa-exclamation-triangle"></i>
                        <div> ${error} </div>`;
                    showStatus("Error", message);
                }
            }
        );
    });
}

function loadMyGoalsHandler() {
    $(`#myGoals`).click(() => {
        $(`header nav a`).removeClass("active");
        $(`#myGoals`).addClass("active");

        $(`.nav a`).removeClass("active");
        $(`#allGoals`).addClass("active");

        loadMyGoals();
    });

    $(`#allGoals`).click(() => {
        $(`.nav a`).removeClass("active");
        $(`#allGoals`).addClass("active");

        let isMyGoals = $(`#myGoals`).hasClass("active");
        isMyGoals ? loadMyGoals() : loadGoals();
    });
    $(`#weekGoals`).click(() => {
        $(`.nav a`).removeClass("active");
        $(`#weekGoals`).addClass("active");

        let isMyGoals = $(`#myGoals`).hasClass("active");
        var date = new Date();
        date.setDate(date.getDate() - 7);
        date = date.getTime();
        isMyGoals ? loadMyGoals(date) : loadGoals(date);
    });
    $(`#monthGoals`).click(() => {
        $(`.nav a`).removeClass("active");
        $(`#monthGoals`).addClass("active");

        let isMyGoals = $(`#myGoals`).hasClass("active");

        var date = new Date();
        date.setDate(date.getDate() - 31);
        date = date.getTime();
        isMyGoals ? loadMyGoals(date) : loadGoals(date);
    });
}

function onMarkHandler() {
    $(`#edit-isMarked`).click(() => {
        let isChecked = $(`#edit-isMarked`).prop('checked');
        markAd(true, isChecked);
    });
    $(`#create-isMarked`).click(() => {
        let isChecked = $(`#create-isMarked`).prop('checked');
        markAd(false, isChecked);
    });
}

function markAd(isEditPopup, isMarked) {
    let popupClass = isEditPopup ? "#editModal" : "#createModal";
    let element = $(`${popupClass} .block`);
    isMarked ? element.addClass('block-marked') : element.removeClass('block-marked');
    if (isEditPopup) {
        $(`#edit-isMarked`).prop('checked', isMarked);
    } else {
        $(`#create-isMarked`).prop('checked', isMarked);
    }
}

function loadGoals() {
    $(".ads").html(`<div class="desc">Loading...</div>`);

    let dateFrom = "";
    let dateTo = "";
    let count = "";

    contract.getGoals(dateFrom, dateTo, count, (resp) => {
        if (resp && resp.result) {
            if (!resp.result.startsWith("TypeError:")) {
                let ads = JSON.parse(resp.result);
                ads = ads.reverse();

                document.querySelector(".ads").innerHTML = ads.length == 0 ? `<div class="desc">No Goals</div>` : '';

                for (let ad of ads) {
                    showAd(ad);
                }
            }
        } else {
            loadGoals();
        }
    });
}

function loadMyGoals(dateFrom) {
    $(".ads").html(`<div class="desc">Loading...</div>`);

    dateFrom = dateFrom || "";

    let dateTo = "";
    let count = "";

    contract.getUserGoals(account.wallet, dateFrom, dateTo, count, (resp) => {
        if (resp && resp.result) {
            if (!resp.result.startsWith("TypeError:")) {
                let ads = JSON.parse(resp.result);
                ads = ads.reverse();

                document.querySelector(".ads").innerHTML = ads.length == 0 ? `<div class="desc">No Goals</div>` : '';

                for (let ad of ads) {
                    showAd(ad);
                }
            }
        } else {
            loadMyGoals();
        }
    });
}

function showAd(ad) {
    if (ad != null) {
        ad.wasMarked = ad.isMarked;
        let markedClass = ad.isMarked ? " block-marked" : "";
        let editBtn = deleteBtn = "";
        ad.message = ad.message.replaceAll("#n", "<br>");

        if (ad.wallet == account.wallet) {
            editBtn =
                `<a href="#" class="edit" data-toggle="modal" data-target="#editModal">
                    <i class="far fa-edit"></i>
                </a>`;
            deleteBtn =
                `<a href="#" class="delete">
                    <i class="far fa-trash-alt"></i>
                </a>`;
        }
        let progress = parseFloat((convertWeiToNas(+ad.collected) / ad.amount * 100).toFixed(2));
        if (progress == Infinity) {
            progress = 0;
        }

        let innerHtml =
            `<div class="card block${markedClass}" data-id="${ad.id}">
                <div class="buttons">
                    ${editBtn}
                    ${deleteBtn}
                </div>
                <div class="content card-body d-flex justify-content-between flex-column">
                    <div>
                        <div class="title text-center">${ad.title}</div>
                        <div>${ad.message}</div>
                    </div>
                    <div>
                        <div class="progress" style="height: 10px; margin-top: 30px;">
                            <div class="progress-bar ${progress >= 100 ? "bg-success" : "progress-bar-animated"} progress-bar-striped" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        <div class="card-text d-flex justify-content-between mt-2">
                            <div>
                                <small class="text-success">${convertWeiToNas(ad.collected)} NAS</small>
                                <div class="text-center">
                                    <small class="text-muted">Collected</small>
                                </div>
                            </div>
                            <div>
                                <small class="text-muted">${ad.amount} NAS</small>
                                <div class="text-center">
                                    <small class="text-muted">Goal</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-center donate" style="position: relative;">
                            <button class="btn btn-warning">Donate</button>
                            <div class="d-flex align-items-center status" style="position: absolute; right: 60px; top: 23px;"></div>
                    </div>
                </div>
                
                <div class="footer d-flex align-items-center">
                    <div>
                        <div>
                            <i class="far fa-clock"></i> ${Date.fromUnixtime(ad.created)}
                        </div>
                        <div>
                            <i class="far fa-user"></i> ${ad.wallet}
                        </div>
                    </div>
                </div>
            </div>`;

        let container = document.querySelector(".ads");
        let div = document.createElement('div');
        div.innerHTML = innerHtml;
        container.append(div.firstChild);

        $(`.block[data-id=${ad.id}] .donate button`).click(() => {
            donate(ad);
        });

        if (ad.wallet == account.wallet) {
            $(`.block[data-id=${ad.id}] .delete`).click(() => {
                deleteGoal(ad);
            });
            $(`.block[data-id=${ad.id}] .edit`).click(() => {
                markAd(true, ad.isMarked);

                ad.message = ad.message.replaceAll("<br>", "\n");

                $(`#editForm`).attr('data-id', ad.id);
                $(`#edit-title`).val(ad.title);
                $(`#edit-message`).val(ad.message);
                $(`#edit-amount`).val(ad.amount);
                $(`#edit-wasMarked`).prop('checked', ad.wasMarked);
                $("#editModal .status").html("");
            });
        }
    }
}

function deleteGoal(ad) {
    if (ad.wallet != account.wallet) {
        showStatus("Warning", "You can't delete other people's Goals");
        return;
    }

    contract.deleteGoal(ad.id,
        resp => {
            loadGoals();
        },
        err => {
            if (err.rejected) {
                showStatusRegected("Goal deleting");
            } else {
                let error = err.execute_error ? err.execute_error : err.execute_result;
                let message =
                    `<i class="fa fa-exclamation-triangle"></i>
                        <div> ${error} </div>`;
                showStatus("Error", message);
            }
        }
    );
}

function donate(goal) {
    $(`.block[data-id=${goal.id}] .donate .status`).html(getLoader());

    contract.donate(goal.id,
        resp => {
            $(`.block[data-id=${goal.id}] .donate .status`).html(goodStatus());
            // loadGoals();
        },
        err => {
            $(`.block[data-id=${goal.id}] .donate .status`).html("");
            if (err.rejected) {
                showStatusRegected("Goal Donating");
            } else {
                let error = err.execute_error ? err.execute_error : err.execute_result;
                let message =
                    `<i class="fa fa-exclamation-triangle"></i>
                        <div> ${error} </div>`;
                showStatus("Error", message);
            }
        }
    );
}

function showStatus(title, message) {
    $('#statusModal .modal-title').html(title);
    $('#statusModal .modal-body').html(message);
    $('#statusModal').modal('show');
}

function showStatusRegected(title) {
    let message =
        `<i class="fa fa-undo-alt"></i>
        <div> Transaction rejected </div>`;
    showStatus(title, message);
}

function getLoader() {
    return '<div class="lds-ring d-flex align-items-center"><div></div><div></div><div></div><div></div></div>';
}

function goodStatus() {
    return '<div class="lds-ring d-flex align-items-center"><i class="fa fa-check" style="color: #28a745;"></i></div>';
}
