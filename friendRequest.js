/*
 * Script Name: Friend Request
 * Version: v1.0.2
 * Last Updated: 2021-12-02
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: RedAlert#9859 (Discord)
 * Approved: N/A
 * Approved Date: 2021-09-20
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
	scriptData: {
		prefix: 'friendRequest',
		name: 'Friend Request',
		version: 'έκδοση 1.0.2',
		author: 'costaspapoytsis7',
		authorUrl: 'https://twscripts.dev/',
		helpLink: '#',
	},
	translations: {
		en_DK: {
			'Friend Request': 'Αίτημα φιλίας',
			Help: 'Help',
			'Fetching world data ...': 'Fetching world data ...',
			Rank: 'Rank',
			Player: 'Παίκτης',
			Villages: 'Χωριά',
			Points: 'Πόντοι',
			Action: 'Ενέργεια',
			'Add as friend': 'Κάνε φίλο',
			'There was an error fetching the friends list!': 'There was an error fetching the friends list!',
			'Redirecting...': 'Redirecting...',
			'There was an error!': 'There was an error!',
		},
	},
	allowedMarkets: [],
	allowedScreens: ['buddies'],
	allowedModes: [],
	isDebug: DEBUG,
	enableCountApi: true,
};

$.getScript('https://twscripts.dev/scripts/twSDK.js', function () {
	// Initialize Library
	twSDK.init(scriptConfig);
	const scriptInfo = twSDK.scriptInfo();
	const isValidScreen = twSDK.checkValidLocation('screen');

	if (isValidScreen) {
		try {
			initMain();
		} catch (error) {
			UI.ErrorMessage(twSDK.tt('There was an error!'));
			console.error(`${scriptInfo} Error:`, error);
		}
	} else {
		UI.InfoMessage(twSDK.tt('Redirecting...'));
		twSDK.redirectTo('buddies');
	}

	// Initialize main script logic
	async function initMain() {
		const players = await twSDK.worldDataAPI('player');
		const currentFriends = fetchCurrentFriendsList();

		// sort and filter
		const sortedPlayersByRank = players.sort((a, b) => a[5] - b[5]);
		const currentFriendIds = currentFriends.map((friend) => parseInt(friend.id));
		const filteredPlayers = sortedPlayersByRank.filter((player) =>
			player.push(currentFriendIds.includes(parseInt(player[0])))
		);

		const playersTable = buildPlayersTable(filteredPlayers);

		const content = `
			<div class="ra-mb15 ra-mh400">
				${playersTable}
			</div>
		`;

		const customStyle = `
			.ra-mh400 { overflow-y: auto; max-height: 400px; }
			.ra-existing-player td { background-color: #ffca6a !important; }
		`;

		twSDK.renderFixedWidget(content, 'raFriendRequest', 'ra-friend-request', customStyle, '560px');

		// register action Handlers
		onClickAddFriend();
	}

	// Action Handler: Add to friend click handler
	function onClickAddFriend() {
		jQuery('.btn-add-friend').on('click', function () {
			const addFriendLink = jQuery(this).attr('data-href');
			jQuery(this).addClass('btn-confirm-yes');
			jQuery('.btn-add-friend').attr('disabled', 'disabled');
			setTimeout(() => {
				jQuery('.btn-add-friend').removeAttr('disabled');
			}, 200);
			jQuery.get(addFriendLink);
		});
	}

	// Helper: Build the players table
	function buildPlayersTable(players) {
		let playersTable = `
			<table class="ra-table" width="100%">
				<thead>
					<tr>
						<th>${twSDK.tt('Rank')}</th>
						<th class="ra-tal">${twSDK.tt('Player')}</th>
						<th>${twSDK.tt('Villages')}</th>
						<th>${twSDK.tt('Points')}</th>
						<th>${twSDK.tt('Action')}</th>
					</tr>
				</thead>
				<tbody>
		`;

		players.forEach((player) => {
			const [id, name, ally, villages, points, rank, existing] = player;
			const hash = game_data.csrf;
			if (name !== undefined && id) {
				playersTable += `
					<tr class="${existing ? 'ra-existing-player' : ''}">
						<td>${rank}</td>
						<td class="ra-tal">
							<a href="/game.php?screen=info_player&id=${id}" target="_blank" rel="noopener noreferrer">
								${twSDK.cleanString(name)}
							</a>
						</td>
						<td>
							${twSDK.formatAsNumber(villages)}
						</td>
						<td>
							${twSDK.formatAsNumber(points)}
						</td>
						<td>
							<span class="btn btn-add-friend ${
								existing ? 'btn-disabled' : ''
							}" data-href="/game.php?screen=info_player&id=${id}&action=add_friend&h=${hash}">
								${twSDK.tt('Add as friend')}
							</span>
						</td>
					</tr>
				`;
			}
		});

		playersTable += `</tbody></table>`;

		return playersTable;
	}

	// Helper: Get current friends list
	function fetchCurrentFriendsList() {
		const currentFriends = [];

		const currentFriendsTable = jQuery('#content_value > table:nth-child(6) > tbody > tr').not(':eq(0)');
		const friendRequestsTable = jQuery('#content_value > table:nth-child(8) > tbody > tr').not(':eq(0)');
		const incomingFriendsTable = jQuery('#content_value > table:nth-child(10) > tbody > tr').not(':eq(0)');

		currentFriendsTable.each(function () {
			const playerName = jQuery(this).find('td:eq(1)').text().trim();
			const playerLink = jQuery(this).find('td:eq(1) a').attr('href');
			const playerId = twSDK.getParameterByName('id', window.location.origin + playerLink);
			currentFriends.push({
				id: parseInt(playerId),
				name: playerName,
			});
		});

		friendRequestsTable.each(function () {
			const playerName = jQuery(this).find('td:eq(0)').text().trim();
			const playerLink = jQuery(this).find('td:eq(0) a').attr('href');
			const playerId = twSDK.getParameterByName('id', window.location.origin + playerLink);
			currentFriends.push({
				id: parseInt(playerId),
				name: playerName,
			});
		});

		incomingFriendsTable.each(function () {
			const playerName = jQuery(this).find('td:eq(0)').text().trim();
			const playerLink = jQuery(this).find('td:eq(0) a').attr('href');
			const playerId = twSDK.getParameterByName('id', window.location.origin + playerLink);
			currentFriends.push({
				id: parseInt(playerId),
				name: playerName,
			});
		});

		return currentFriends;
	}
});
